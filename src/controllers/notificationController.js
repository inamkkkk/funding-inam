const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const catchAsync = require('../utils/catchAsync');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.get('/', authenticate, catchAsync(async (req, res) => {
    const userId = req.user.id;
    const notifications = await notificationService.getNotificationsForUser(userId, req.query);
    res.json(notifications);
}));

router.patch('/:id/read', authenticate, catchAsync(async (req, res) => {
    const userId = req.user.id;
    const notificationId = req.params.id;
    await notificationService.markAsRead(notificationId, userId);
    res.status(200).json({ message: 'Notification marked as read' });
}));

module.exports = router;