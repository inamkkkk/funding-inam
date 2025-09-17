const express = require('express');
const router = express.Router();
const campaignService = require('../services/campaignService');
const Log = require('../models/logModel');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware.protect, async (req, res) => {
    try {
        const campaign = await campaignService.createCampaign({ ...req.body, creatorId: req.user.id });
        await Log.create({ type: 'INFO', module: 'CampaignController', message: `Campaign created: ${campaign._id}` });
        res.status(201).json(campaign);
    } catch (error) {
        await Log.create({ type: 'ERROR', module: 'CampaignController', message: `Failed to create campaign: ${error.message}` });
        res.status(400).json({ message: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const campaign = await campaignService.getCampaignById(req.params.id);
        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }
        await Log.create({ type: 'INFO', module: 'CampaignController', message: `Fetched campaign details: ${req.params.id}` });
        res.json(campaign);
    } catch (error) {
        await Log.create({ type: 'ERROR', module: 'CampaignController', message: `Failed to get campaign ${req.params.id}: ${error.message}` });
        res.status(500).json({ message: error.message });
    }
});

router.post('/process-webhook', async (req, res) => {
    // Placeholder for payment gateway webhooks, e.g., Stripe, PayPal
    try {
        await Log.create({ type: 'INFO', module: 'CampaignController', message: 'Received payment webhook' });
        // Logic to process webhook events and update pledge/campaign status
        res.status(200).send('Webhook received');
    } catch (error) {
        await Log.create({ type: 'ERROR', module: 'CampaignController', message: `Webhook processing failed: ${error.message}` });
        res.status(500).json({ message: error.message });
    }
});

router.put('/:id', authMiddleware.protect, async (req, res) => {
    try {
        const campaign = await campaignService.updateCampaign(req.params.id, req.body, req.user.id);
        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found or unauthorized update' });
        }
        await Log.create({ type: 'INFO', module: 'CampaignController', message: `Campaign updated: ${req.params.id}` });
        res.json(campaign);
    } catch (error) {
        await Log.create({ type: 'ERROR', module: 'CampaignController', message: `Failed to update campaign ${req.params.id}: ${error.message}` });
        res.status(400).json({ message: error.message });
    }
});

router.delete('/:id', authMiddleware.protect, async (req, res) => {
    try {
        const deleted = await campaignService.deleteCampaign(req.params.id, req.user.id);
        if (!deleted) {
            return res.status(404).json({ message: 'Campaign not found or unauthorized deletion' });
        }
        await Log.create({ type: 'INFO', module: 'CampaignController', message: `Campaign deleted: ${req.params.id}` });
        res.status(200).json({ message: 'Campaign deleted successfully' });
    } catch (error) {
        await Log.create({ type: 'ERROR', module: 'CampaignController', message: `Failed to delete campaign ${req.params.id}: ${error.message}` });
        res.status(500).json({ message: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const campaigns = await campaignService.listCampaigns(req.query);
        await Log.create({ type: 'INFO', module: 'CampaignController', message: 'Listed campaigns with filters' });
        res.json(campaigns);
    } catch (error) {
        await Log.create({ type: 'ERROR', module: 'CampaignController', message: `Failed to list campaigns: ${error.message}` });
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
