const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('paypal-rest-sdk');
paypal.configure({
  'mode': 'sandbox', // or 'live'
  'client_id': process.env.PAYPAL_CLIENT_ID,
  'client_secret': process.env.PAYPAL_CLIENT_SECRET
});
const crypto = require('../utils/cryptoWallet');
const Pledge = require('../models/pledgeModel');
const Campaign = require('../models/campaignModel');
const User = require('../models/userModel');
const Log = require('../models/logModel');

async function processStripePayment(paymentDetails, campaignId, userId) {
    try {
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) throw new Error('Campaign not found');
        if (campaign.raisedAmount + paymentDetails.amount > campaign.goalAmount) {
            throw new Error('Pledge exceeds campaign goal');
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Pledge for ${campaign.title}`,
                        },
                        unit_amount: paymentDetails.amount * 100, 
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/payment/success?pledgeId={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
            metadata: { userId, campaignId }
        });

        const pledge = new Pledge({
            campaignId,
            userId,
            amount: paymentDetails.amount,
            paymentMethod: 'stripe',
            paymentStatus: 'pending',
            anonymous: paymentDetails.anonymous || false,
            rewardTier: paymentDetails.rewardTier
        });
        await pledge.save();
        await Log.create({
            type: 'payment',
            module: 'PaymentService',
            message: `Stripe checkout session created for pledge ${pledge._id}`,
            timestamp: new Date()
        });
        return session.id;
    } catch (error) {
        await Log.create({
            type: 'error',
            module: 'PaymentService',
            message: `Stripe payment processing failed: ${error.message}`,
            timestamp: new Date()
        });
        throw error;
    }
}

async function processPaypalPayment(paymentDetails, campaignId, userId) {
    try {
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) throw new Error('Campaign not found');
        if (campaign.raisedAmount + paymentDetails.amount > campaign.goalAmount) {
            throw new Error('Pledge exceeds campaign goal');
        }

        const create_payment_json = {
            intent: 'sale',
            payer: {
                payment_method: 'paypal'
            },
            redirect_urls: {
                return_url: `${process.env.BACKEND_URL}/payments/paypal/return`,
                cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`
            },
            transactions: [
                {
                    amount: {
                        currency: 'USD',
                        total: paymentDetails.amount.toString()
                    },
                    description: `Pledge for campaign ${campaign.title}`,
                    custom: JSON.stringify({ userId, campaignId, rewardTier: paymentDetails.rewardTier, anonymous: paymentDetails.anonymous || false })
                }
            ]
        };

        return new Promise((resolve, reject) => {
            paypal.payment.create(create_payment_json, async function (error, payment) {
                if (error) {
                    await Log.create({
                        type: 'error',
                        module: 'PaymentService',
                        message: `Paypal payment creation failed: ${error.message}`,
                        timestamp: new Date()
                    });
                    reject(error);
                } else {
                    const pledge = new Pledge({
                        campaignId,
                        userId,
                        amount: paymentDetails.amount,
                        paymentMethod: 'paypal',
                        paymentStatus: 'pending',
                        anonymous: paymentDetails.anonymous || false,
                        rewardTier: paymentDetails.rewardTier
                    });
                    await pledge.save();
                    await Log.create({
                        type: 'payment',
                        module: 'PaymentService',
                        message: `Paypal payment created for pledge ${pledge._id} with ID ${payment.id}`,
                        timestamp: new Date()
                    });
                    resolve(payment.links.find(link => link.rel === 'approval_url').href);
                }
            });
        });

    } catch (error) {
        await Log.create({
            type: 'error',
            module: 'PaymentService',
            message: `Paypal payment processing failed: ${error.message}`,
            timestamp: new Date()
        });
        throw error;
    }
}

async function processCryptoPayment(paymentDetails, campaignId, userId) {
    try {
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) throw new Error('Campaign not found');
        if (campaign.raisedAmount + paymentDetails.amount > campaign.goalAmount) {
            throw new Error('Pledge exceeds campaign goal');
        }

        const walletAddress = await crypto.generateNewAddress();

        const pledge = new Pledge({
            campaignId,
            userId,
            amount: paymentDetails.amount,
            paymentMethod: 'crypto',
            paymentStatus: 'pending',
            anonymous: paymentDetails.anonymous || false,
            rewardTier: paymentDetails.rewardTier
        });
        await pledge.save();
        await Log.create({
            type: 'payment',
            module: 'PaymentService',
            message: `Crypto payment initiated for pledge ${pledge._id}. Address: ${walletAddress}`,
            timestamp: new Date()
        });
        return { address: walletAddress, pledgeId: pledge._id };
    } catch (error) {
        await Log.create({
            type: 'error',
            module: 'PaymentService',
            message: `Crypto payment processing failed: ${error.message}`,
            timestamp: new Date()
        });
        throw error;
    }
}

async function handleStripeWebhook(payload) {
    const sig = request.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return false;
    }

    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            const { userId, campaignId } = session.metadata;
            const pledge = await Pledge.findOne({ _id: session.metadata.pledgeId || session.payment_intent }); // Attempt to find pledge by session ID or payment intent
            if (pledge && pledge.paymentStatus === 'pending') {
                pledge.paymentStatus = 'completed';
                await pledge.save();
                const campaign = await Campaign.findById(campaignId);
                campaign.raisedAmount += pledge.amount;
                await campaign.save();
                await Log.create({
                    type: 'payment',
                    module: 'PaymentService',
                    message: `Stripe payment completed for pledge ${pledge._id}`,
                    timestamp: new Date()
                });
            }
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }
    return true;
}

async function handlePaypalWebhook(webhook) {
    const { id, resource_type, event_type, resource } = webhook;
    
    if (event_type === 'PAYMENT.SALE.COMPLETED') {
        const { amount, parent_id, custom, status } = resource;
        
        if (status === 'COMPLETED') {
            const { userId, campaignId, rewardTier, anonymous } = JSON.parse(custom);
            const pledge = await Pledge.findOne({ 'paymentMethod': 'paypal', 'paymentStatus': 'pending', 'campaignId': campaignId, 'userId': userId });
            if (pledge) {
                pledge.paymentStatus = 'completed';
                await pledge.save();
                const campaign = await Campaign.findById(campaignId);
                campaign.raisedAmount += pledge.amount;
                await campaign.save();
                await Log.create({
                    type: 'payment',
                    module: 'PaymentService',
                    message: `Paypal payment completed for pledge ${pledge._id} via webhook. Transaction ID: ${id}`,
                    timestamp: new Date()
                });
            }
        }
    }
}

async function refundPledge(pledgeId, amount, reason) {
    try {
        const pledge = await Pledge.findById(pledgeId);
        if (!pledge) throw new Error('Pledge not found');

        if (pledge.paymentMethod === 'stripe') {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount * 100,
                currency: 'usd',
                payment_method: pledge.stripePaymentMethodId, 
                confirm: true,
                error_on_requires_action: true,
            });
            if (paymentIntent.status === 'succeeded') {
                pledge.paymentStatus = 'refunded';
                await pledge.save();
                const campaign = await Campaign.findById(pledge.campaignId);
                campaign.raisedAmount -= pledge.amount;
                await campaign.save();
                await Log.create({
                    type: 'refund',
                    module: 'PaymentService',
                    message: `Stripe refund processed for pledge ${pledgeId}. Amount: ${amount}`,
                    timestamp: new Date()
                });
                return true;
            }
        } else if (pledge.paymentMethod === 'paypal') {
            const refund = await paypal.payment.refund(pledge.paypalTransactionId, {
                amount: {
                    total: amount.toString(),
                    currency: 'USD'
                }
            });
            if (refund.state === 'completed') {
                pledge.paymentStatus = 'refunded';
                await pledge.save();
                const campaign = await Campaign.findById(pledge.campaignId);
                campaign.raisedAmount -= pledge.amount;
                await campaign.save();
                await Log.create({
                    type: 'refund',
                    module: 'PaymentService',
                    message: `Paypal refund processed for pledge ${pledgeId}. Amount: ${amount}`,
                    timestamp: new Date()
                });
                return true;
            }
        } else if (pledge.paymentMethod === 'crypto') {
            await Log.create({
                type: 'refund',
                module: 'PaymentService',
                message: `Crypto refund initiated manually for pledge ${pledgeId}. Amount: ${amount}`,
                timestamp: new Date()
            });
            return false; 
        }
        throw new Error('Unsupported payment method for refund');
    } catch (error) {
        await Log.create({
            type: 'error',
            module: 'PaymentService',
            message: `Refund processing failed for pledge ${pledgeId}: ${error.message}`,
            timestamp: new Date()
        });
        throw error;
    }
}

module.exports = {
    processStripePayment,
    processPaypalPayment,
    processCryptoPayment,
    handleStripeWebhook,
    handlePaypalWebhook,
    refundPledge
};