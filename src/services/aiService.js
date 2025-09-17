const Campaign = require('../models/Campaign');
const User = require('../models/User');
const logModel = require('../models/Log');
const appConfig = require('../config/appConfig');
const aiConfig = require('../config/aiConfig');

const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(aiConfig.geminiApiKey);

const aiService = {
    async getPersonalizedCampaignRecommendations(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const campaigns = await Campaign.find({ status: 'active' });
            if (campaigns.length === 0) {
                return [];
            }

            const prompt = `Given the user profile: Name: ${user.name}, Email: ${user.email}, Role: ${user.role}. And the following active campaigns: ${JSON.stringify(campaigns)}. Provide 3 personalized campaign recommendations for this user. Focus on their interests and past interactions if available. Respond with a JSON array of campaign IDs.`;

            const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const recommendedCampaignIds = JSON.parse(text);

            const recommendedCampaigns = campaigns.filter(campaign => recommendedCampaignIds.includes(campaign._id.toString()));

            await logModel.create({
                type: 'AI_RECOMMENDATION',
                module: 'aiService',
                message: `Generated personalized campaign recommendations for user ${userId}`
            });

            return recommendedCampaigns;
        } catch (error) {
            await logModel.create({
                type: 'ERROR',
                module: 'aiService',
                message: `Error getting personalized campaign recommendations: ${error.message}`
            });
            throw error;
        }
    },

    async automateCampaignUpdates(campaignId) {
        try {
            const campaign = await Campaign.findById(campaignId);
            if (!campaign) {
                throw new Error('Campaign not found');
            }

            const prompt = `Analyze the current status of campaign '${campaign.title}' (ID: ${campaign._id}). Goal: ${campaign.goalAmount}, Raised: ${campaign.raisedAmount}, Deadline: ${campaign.deadline}. Provide a concise update text for the campaign page.`;

            const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const updateText = response.text();

            await logModel.create({
                type: 'AI_AUTOMATION',
                module: 'aiService',
                message: `Generated automated update for campaign ${campaignId}`
            });

            return updateText;
        } catch (error) {
            await logModel.create({
                type: 'ERROR',
                module: 'aiService',
                message: `Error automating campaign updates for campaign ${campaignId}: ${error.message}`
            });
            throw error;
        }
    },

    async summarizeBackerMessages(campaignId) {
        try {
            const pledges = await Pledge.find({ campaignId: campaignId }).populate('userId', 'name email');
            if (pledges.length === 0) {
                return 'No backer messages available for this campaign.';
            }

            const messages = pledges.map(p => `${p.userId.name} (${p.userId.email}): ${p.comment || 'No comment provided'}`).join('\n');

            const prompt = `Summarize the following backer messages for campaign ${campaignId}:\n${messages}\n Focus on common themes, questions, and feedback.`;

            const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const summary = response.text();

            await logModel.create({
                type: 'AI_SUMMARIZATION',
                module: 'aiService',
                message: `Summarized backer messages for campaign ${campaignId}`
            });

            return summary;
        } catch (error) {
            await logModel.create({
                type: 'ERROR',
                module: 'aiService',
                message: `Error summarizing backer messages for campaign ${campaignId}: ${error.message}`
            });
            throw error;
        }
    }
};

module.exports = aiService;
