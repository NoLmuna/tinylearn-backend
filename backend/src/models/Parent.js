/* eslint-disable no-undef */
const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema({
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
    phoneNumber: {
        type: String,
        default: null,
    },
    relationship: {
        type: String,
        default: null,
    },
    accountStatus: {
        type: String,
        enum: ['active', 'suspended'],
        default: 'active',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastLogin: {
        type: Date,
        default: null,
    }
}, {
    timestamps: true,
    collection: 'parents'
});

parentSchema.index({ accountStatus: 1 });

module.exports = mongoose.model('Parent', parentSchema);
