const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Log = require('../models/logModel');

const registerUser = async (userData) => {
    try {
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
            throw new Error('Email already exists');
        }
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const newUser = new User({ ...userData, password: hashedPassword });
        await newUser.save();
        await Log.create({ type: 'USER_REGISTRATION', module: 'Users', message: `User ${userData.email} registered successfully.` });
        const token = jwt.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        return { user: newUser, token };
    } catch (error) {
        await Log.create({ type: 'USER_REGISTRATION_FAILED', module: 'Users', message: error.message });
        throw error;
    }
};

const loginUser = async (email, password) => {
    try {
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('Invalid credentials');
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }
        await Log.create({ type: 'USER_LOGIN', module: 'Users', message: `User ${email} logged in successfully.` });
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        return { user, token };
    } catch (error) {
        await Log.create({ type: 'USER_LOGIN_FAILED', module: 'Users', message: error.message });
        throw error;
    }
};

const getUserProfile = async (userId) => {
    try {
        const user = await User.findById(userId).select('-password');
        if (!user) {
            throw new Error('User not found');
        }
        await Log.create({ type: 'FETCH_USER_PROFILE', module: 'Users', message: `Profile fetched for user ${userId}.` });
        return user;
    } catch (error) {
        await Log.create({ type: 'FETCH_USER_PROFILE_FAILED', module: 'Users', message: error.message });
        throw error;
    }
};

const updateUserProfile = async (userId, updateData) => {
    try {
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }
        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
        if (!updatedUser) {
            throw new Error('User not found');
        }
        await Log.create({ type: 'UPDATE_USER_PROFILE', module: 'Users', message: `Profile updated for user ${userId}.` });
        return updatedUser;
    } catch (error) {
        await Log.create({ type: 'UPDATE_USER_PROFILE_FAILED', module: 'Users', message: error.message });
        throw error;
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile
};