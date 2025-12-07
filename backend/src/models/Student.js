/* eslint-disable no-undef */
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
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
    age: {
        type: Number,
        min: 1,
        max: 18,
        default: null,
    },
    grade: {
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
    collection: 'students'
});

studentSchema.index({ grade: 1 });
studentSchema.index({ accountStatus: 1 });

module.exports = mongoose.model('Student', studentSchema);
