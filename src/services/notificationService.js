const Notification = require('../models/Notification');
const User = require('../models/User');
const logModel = require('../models/Log');
const appConfig = require('../config/appConfig');

const notificationService = {
  sendNotification: async (userId, type, content) => {
    try {
      const notification = new Notification({
        userId,
        type,
        content,
        readStatus: false,
        createdAt: new Date()
      });
      await notification.save();
      await logModel.create({
        type: 'INFO',
        module: 'NotificationService',
        message: `Notification sent to user ${userId} of type ${type}`,
        timestamp: new Date()
      });
      return notification;
    } catch (error) {
      await logModel.create({
        type: 'ERROR',
        module: 'NotificationService',
        message: `Failed to send notification to user ${userId}: ${error.message}`,
        timestamp: new Date()
      });
      throw error;
    }
  },

  getNotificationsForUser: async (userId, queryParams) => {
    try {
      const { page = 1, limit = 10, readStatus } = queryParams;
      const filter = { userId };
      if (readStatus !== undefined) {
        filter.readStatus = readStatus === 'true';
      }
      const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
      const total = await Notification.countDocuments(filter);
      await logModel.create({
        type: 'INFO',
        module: 'NotificationService',
        message: `Fetched notifications for user ${userId}`,
        timestamp: new Date()
      });
      return { notifications, total, page, limit };
    } catch (error) {
      await logModel.create({
        type: 'ERROR',
        module: 'NotificationService',
        message: `Failed to fetch notifications for user ${userId}: ${error.message}`,
        timestamp: new Date()
      });
      throw error;
    }
  },

  markAsRead: async (notificationId, userId) => {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { $set: { readStatus: true } },
        { new: true }
      );
      if (!notification) {
        throw new Error('Notification not found or does not belong to user');
      }
      await logModel.create({
        type: 'INFO',
        module: 'NotificationService',
        message: `Marked notification ${notificationId} as read for user ${userId}`,
        timestamp: new Date()
      });
      return notification;
    } catch (error) {
      await logModel.create({
        type: 'ERROR',
        module: 'NotificationService',
        message: `Failed to mark notification ${notificationId} as read for user ${userId}: ${error.message}`,
        timestamp: new Date()
      });
      throw error;
    }
  }
};

module.exports = notificationService;
