/* eslint-disable no-undef */
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    password: {
        type: String,
        required: true,
    },
    isSuperAdmin: {
        type: Boolean,
        default: false,
    },
    accountStatus: {
        type: String,
        enum: ['active', 'suspended'],
        default: 'active',
    },
    lastLogin: {
        type: Date,
        default: null,
    }
}, {
    timestamps: true,
    collection: 'admins'
});

module.exports = mongoose.model('Admin', adminSchema);
