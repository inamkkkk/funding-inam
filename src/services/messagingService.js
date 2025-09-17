const Message = require('../models/Message');
const User = require('../models/User');
const logModel = require('../models/Log');
const appConfig = require('../config/appConfig');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const messagingService = {
    sendMessage: async (messageData) => {
        const { fromUserId, toUserId, channel, message } = messageData;

        const sender = await User.findById(fromUserId);
        const receiver = await User.findById(toUserId);

        if (!sender || !receiver) {
            throw new Error('Sender or receiver not found.');
        }

        const newMessage = new Message({
            fromUserId,
            toUserId,
            channel,
            message,
            createdAt: new Date()
        });

        await newMessage.save();

        if (channel === 'email') {
            const msg = {
                to: receiver.email,
                from: appConfig.email.fromAddress,
                subject: `New Message from ${sender.name}`,
                text: message,
                html: `<strong>${message}</strong>`
            };
            try {
                await sgMail.send(msg);
            } catch (error) {
                console.error(error);
                await logModel.create({
                    type: 'ERROR',
                    module: 'MessagingService',
                    message: `Failed to send email to ${receiver.email}`,
                    timestamp: new Date()
                });
            }
        }

        await logModel.create({
            type: 'INFO',
            module: 'MessagingService',
            message: `Message sent via ${channel} to ${receiver.email}`,
            timestamp: new Date()
        });

        return newMessage;
    },

    getMessagesForUser: async (userId) => {
        const messages = await Message.find({ $or: [{ fromUserId: userId }, { toUserId: userId }] }).populate('fromUserId', 'name email').populate('toUserId', 'name email');
        return messages;
    }
};

module.exports = messagingService;
