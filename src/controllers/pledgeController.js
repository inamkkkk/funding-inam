const express = require('express');
const router = express.Router();
const pledgeService = require('../services/pledgeService');
const Log = require('../models/logModel');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.post('/', authMiddleware, async (req, res) => {
  try {
    const pledgeData = { ...req.body, userId: req.user.id };
    const newPledge = await pledgeService.makePledge(pledgeData);
    res.status(201).json(newPledge);
    await Log.create({
      type: 'INFO',
      module: 'PledgeController',
      message: `Pledge created by user ${req.user.id} for campaign ${pledgeData.campaignId}`
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
    await Log.create({
      type: 'ERROR',
      module: 'PledgeController',
      message: `Failed to create pledge: ${error.message}`
    });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const pledge = await pledgeService.getPledgeById(req.params.id);
    if (!pledge) {
      return res.status(404).json({ message: 'Pledge not found' });
    }
    res.json(pledge);
    await Log.create({
      type: 'INFO',
      module: 'PledgeController',
      message: `Pledge ${req.params.id} fetched`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
    await Log.create({
      type: 'ERROR',
      module: 'PledgeController',
      message: `Failed to fetch pledge ${req.params.id}: ${error.message}`
    });
  }
});

router.get('/campaigns/:id/pledges', authMiddleware, async (req, res) => {
  try {
    const pledges = await pledgeService.listPledgesForCampaign(req.params.id);
    res.json(pledges);
    await Log.create({
      type: 'INFO',
      module: 'PledgeController',
      message: `Pledges for campaign ${req.params.id} listed`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
    await Log.create({
      type: 'ERROR',
      module: 'PledgeController',
      message: `Failed to list pledges for campaign ${req.params.id}: ${error.message}`
    });
  }
});

module.exports = router;
