const Campaign = require('../models/campaignModel');
const Log = require('../models/logModel');

const createCampaign = async (campaignData) => {
    const campaign = new Campaign(campaignData);
    await campaign.save();
    await Log.create({ type: 'INFO', module: 'Campaign', message: `Campaign created: ${campaign._id}` });
    return campaign;
};

const getCampaignById = async (campaignId) => {
    const campaign = await Campaign.findById(campaignId);
    await Log.create({ type: 'INFO', module: 'Campaign', message: `Fetched campaign: ${campaignId}` });
    return campaign;
};

const updateCampaign = async (campaignId, updateData) => {
    const campaign = await Campaign.findByIdAndUpdate(campaignId, updateData, { new: true });
    await Log.create({ type: 'INFO', module: 'Campaign', message: `Updated campaign: ${campaignId}` });
    return campaign;
};

const deleteCampaign = async (campaignId) => {
    await Campaign.findByIdAndDelete(campaignId);
    await Log.create({ type: 'INFO', module: 'Campaign', message: `Deleted campaign: ${campaignId}` });
};

const listCampaigns = async (filters) => {
    const campaigns = await Campaign.find(filters);
    await Log.create({ type: 'INFO', module: 'Campaign', message: 'Listed campaigns with filters' });
    return campaigns;
};

module.exports = {
    createCampaign,
    getCampaignById,
    updateCampaign,
    deleteCampaign,
    listCampaigns
};