const express = require('express');
const router = express.Router();
const messagingService = require('../services/messagingService');
const Log = require('../models/logModel');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/messages', authMiddleware, async (req, res) => {
    try {
        const messageData = {
            ...req.body,
            fromUserId: req.user.userId
        };
        const newMessage = await messagingService.sendMessage(messageData);
        res.status(201).json(newMessage);
        await Log.create({
            type: 'INFO',
            module: 'MessagingController',
            message: `Message sent from ${req.user.userId}`
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
        await Log.create({
            type: 'ERROR',
            module: 'MessagingController',
            message: `Failed to send message: ${error.message}`
        });
    }
});

router.get('/messages/:userId', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        if (req.user.userId !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const messages = await messagingService.getMessagesForUser(userId);
        res.json(messages);
        await Log.create({
            type: 'INFO',
            module: 'MessagingController',
            message: `Messages fetched for user ${userId}`
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
        await Log.create({
            type: 'ERROR',
            module: 'MessagingController',
            message: `Failed to fetch messages for user ${req.params.userId}: ${error.message}`
        });
    }
});

module.exports = router;