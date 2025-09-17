const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const Log = require('../models/logModel');

router.post('/register', async (req, res) => {
    try {
        const newUser = await userService.registerUser(req.body);
        await Log.create({ type: 'info', module: 'User', message: `User registered: ${newUser.email}` });
        res.status(201).json({ message: 'User registered successfully', userId: newUser._id });
    } catch (error) {
        await Log.create({ type: 'error', module: 'User', message: `Registration failed: ${error.message}` });
        res.status(400).json({ message: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const token = await userService.loginUser(email, password);
        await Log.create({ type: 'info', module: 'User', message: `User logged in: ${email}` });
        res.status(200).json({ token });
    } catch (error) {
        await Log.create({ type: 'error', module: 'User', message: `Login failed: ${error.message}` });
        res.status(401).json({ message: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const user = await userService.getUserProfile(req.params.id);
        if (!user) {
            await Log.create({ type: 'warn', module: 'User', message: `User profile not found: ${req.params.id}` });
            return res.status(404).json({ message: 'User not found' });
        }
        await Log.create({ type: 'info', module: 'User', message: `Fetched user profile: ${user.email}` });
        res.status(200).json(user);
    } catch (error) {
        await Log.create({ type: 'error', module: 'User', message: `Failed to fetch user profile: ${error.message}` });
        res.status(500).json({ message: error.message });
    }
});

router.patch('/:id', async (req, res) => {
    try {
        const updatedUser = await userService.updateUserProfile(req.params.id, req.body);
        if (!updatedUser) {
            await Log.create({ type: 'warn', module: 'User', message: `User not found for update: ${req.params.id}` });
            return res.status(404).json({ message: 'User not found' });
        }
        await Log.create({ type: 'info', module: 'User', message: `User profile updated: ${updatedUser.email}` });
        res.status(200).json(updatedUser);
    } catch (error) {
        await Log.create({ type: 'error', module: 'User', message: `Failed to update user profile: ${error.message}` });
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
