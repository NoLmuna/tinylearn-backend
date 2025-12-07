/* eslint-disable no-undef */
const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
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
    bio: {
        type: String,
        default: null,
    },
    subjectSpecialty: {
        type: String,
        default: null,
    },
    accountStatus: {
        type: String,
        enum: ['pending', 'approved', 'suspended'],
        default: 'pending',
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
    collection: 'teachers'
});

teacherSchema.index({ accountStatus: 1 });
teacherSchema.index({ isActive: 1 });

module.exports = mongoose.model('Teacher', teacherSchema);
