const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const campaignService = require('../services/campaignService');
const pledgeService = require('../services/pledgeService');
const notificationService = require('../services/notificationService');
const Log = require('../models/logModel');
const adminMiddleware = require('../utils/adminMiddleware');
const authMiddleware = require('../utils/authMiddleware');

router.use(authMiddleware);
router.use(adminMiddleware);

// Admin User Management
router.get('/users', async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        await Log.create({ type: 'Error', module: 'AdminController', message: `Failed to fetch users: ${error.message}` });
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});

router.patch('/users/:id', async (req, res) => {
    try {
        const updatedUser = await userService.updateUserRole(req.params.id, req.body.role);
        res.status(200).json(updatedUser);
    } catch (error) {
        await Log.create({ type: 'Error', module: 'AdminController', message: `Failed to update user role: ${error.message}` });
        res.status(500).json({ message: 'Failed to update user role' });
    }
});

// Admin Campaign Management
router.put('/campaigns/:id/status', async (req, res) => {
    try {
        const updatedCampaign = await campaignService.updateCampaignStatus(req.params.id, req.body.status);
        res.status(200).json(updatedCampaign);
    } catch (error) {
        await Log.create({ type: 'Error', module: 'AdminController', message: `Failed to update campaign status: ${error.message}` });
        res.status(500).json({ message: 'Failed to update campaign status' });
    }
});

router.get('/campaigns/all', async (req, res) => {
    try {
        const campaigns = await campaignService.listCampaigns({});
        res.status(200).json(campaigns);
    } catch (error) {
        await Log.create({ type: 'Error', module: 'AdminController', message: `Failed to list all campaigns: ${error.message}` });
        res.status(500).json({ message: 'Failed to list all campaigns' });
    }
});

// Admin Pledge Management
router.get('/pledges/all', async (req, res) => {
    try {
        const pledges = await pledgeService.getAllPledges();
        res.status(200).json(pledges);
    } catch (error) {
        await Log.create({ type: 'Error', module: 'AdminController', message: `Failed to fetch all pledges: ${error.message}` });
        res.status(500).json({ message: 'Failed to fetch all pledges' });
    }
});

router.post('/pledges/:id/refund', async (req, res) => {
    try {
        const { amount, reason } = req.body;
        const refundedPledge = await pledgeService.refundPledge(req.params.id, amount, reason);
        res.status(200).json(refundedPledge);
    } catch (error) {
        await Log.create({ type: 'Error', module: 'AdminController', message: `Failed to refund pledge: ${error.message}` });
        res.status(500).json({ message: 'Failed to refund pledge' });
    }
});

// Admin Notifications
router.post('/notifications/broadcast', async (req, res) => {
    try {
        const { type, content, targetRole } = req.body;
        const sentCount = await notificationService.broadcastNotification(type, content, targetRole);
        res.status(200).json({ message: `Broadcasted notification to ${sentCount} users.` });
    } catch (error) {
        await Log.create({ type: 'Error', module: 'AdminController', message: `Failed to broadcast notification: ${error.message}` });
        res.status(500).json({ message: 'Failed to broadcast notification' });
    }
});

module.exports = router;
