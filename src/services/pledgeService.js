const Pledge = require('../models/Pledge');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const logModel = require('../models/Log');
const appConfig = require('../config/appConfig');

const pledgeService = {
    makePledge: async (pledgeData) => {
        const { campaignId, userId, amount, rewardTier, paymentMethod, anonymous } = pledgeData;

        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            throw new Error('Campaign not found');
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Basic validation based on rules
        if (campaign.creatorId.toString() === userId) {
            throw new Error('Campaign creator cannot pledge to their own campaign.');
        }
        if (campaign.raisedAmount + amount > campaign.goalAmount) {
            // This check might need refinement based on how goalAmount is strictly enforced (e.g., stop accepting pledges once goal is met)
            // For now, we log a warning but allow if the spec implies overfunding is okay.
            await logModel.create({ type: 'warning', module: 'pledgeService', message: `Pledge for campaign ${campaignId} exceeds goal amount.` });
        }

        const newPledge = new Pledge({
            campaignId,
            userId,
            amount,
            rewardTier,
            paymentMethod,
            anonymous: anonymous || false,
            paymentStatus: 'pending' // Initial status, will be updated via webhooks
        });

        await newPledge.save();
        await logModel.create({ type: 'info', module: 'pledgeService', message: `New pledge created for campaign ${campaignId} by user ${userId}` });
        return newPledge;
    },

    getPledgeById: async (pledgeId) => {
        const pledge = await Pledge.findById(pledgeId).populate('campaignId', 'title').populate('userId', 'name email');
        if (!pledge) {
            throw new Error('Pledge not found');
        }
        return pledge;
    },

    listPledgesForCampaign: async (campaignId, filters = {}) => {
        const { limit = 10, skip = 0, paymentStatus } = filters;

        const query = { campaignId };
        if (paymentStatus) {
            query.paymentStatus = paymentStatus;
        }

        const pledges = await Pledge.find(query)
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });

        const totalPledges = await Pledge.countDocuments(query);

        return { pledges, totalPledges };
    },

    updatePledgeStatus: async (pledgeId, status) => {
        const updatedPledge = await Pledge.findByIdAndUpdate(pledgeId, { paymentStatus: status }, { new: true });
        if (!updatedPledge) {
            throw new Error('Pledge not found');
        }
        await logModel.create({ type: 'info', module: 'pledgeService', message: `Pledge ${pledgeId} status updated to ${status}` });
        return updatedPledge;
    }
};

module.exports = pledgeService;
