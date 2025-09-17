const cron = require('node-cron');
const Campaign = require('../models/campaignModel');
const Pledge = require('../models/pledgeModel');
const Log = require('../models/logModel');
const notificationService = require('./notificationService');
const paymentService = require('./paymentService');

const updateCampaignStatuses = async () => {
    try {
        const now = new Date();
        await Campaign.updateMany({ deadline: { $lt: now }, status: 'active' }, { $set: { status: 'failed' } });
        await Campaign.updateMany({ deadline: { $gt: now }, status: 'active' }, { $set: { status: 'active' } }); // Re-evaluate active campaigns
        console.log('Campaign statuses updated successfully.');
        await Log.create({ type: 'scheduler', module: 'campaignStatus', message: 'Campaign statuses updated.' });
    } catch (error) {
        console.error('Error updating campaign statuses:', error);
        await Log.create({ type: 'error', module: 'campaignStatus', message: `Error updating campaign statuses: ${error.message}` });
    }
};

const sendReminders = async () => {
    try {
        const activeCampaigns = await Campaign.find({ status: 'active' });
        for (const campaign of activeCampaigns) {
            const pledges = await Pledge.find({ campaignId: campaign._id, createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }); // Pledges in the last 24 hours
            if (pledges.length > 0) {
                const backerIds = pledges.map(p => p.userId);
                const uniqueBackerIds = [...new Set(backerIds)];
                for (const userId of uniqueBackerIds) {
                    await notificationService.createNotification(userId, 'campaign_reminder', `A campaign you backed, ${campaign.title}, has received new pledges!`);
                }
            }
        }
        console.log('Reminder notifications sent.');
        await Log.create({ type: 'scheduler', module: 'reminders', message: 'Reminder notifications sent.' });
    } catch (error) {
        console.error('Error sending reminders:', error);
        await Log.create({ type: 'error', module: 'reminders', message: `Error sending reminders: ${error.message}` });
    }
};

const generateReports = async () => {
    try {
        // Placeholder for report generation logic
        console.log('Report generation task executed.');
        await Log.create({ type: 'scheduler', module: 'reports', message: 'Report generation task executed.' });
    } catch (error) {
        console.error('Error generating reports:', error);
        await Log.create({ type: 'error', module: 'reports', message: `Error generating reports: ${error.message}` });
    }
};

const scheduleTasks = () => {
    // Update campaign status daily
    cron.schedule('0 0 * * *', updateCampaignStatuses, { timezone: 'UTC' });

    // Send reminders daily
    cron.schedule('0 9 * * *', sendReminders, { timezone: 'UTC' });

    // Generate reports daily
    cron.schedule('0 1 * * *', generateReports, { timezone: 'UTC' });

    console.log('Scheduler tasks scheduled.');
};

module.exports = {
    scheduleTasks
};