/* eslint-disable no-undef */
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderType: {
        type: String,
        enum: ['admin', 'teacher', 'parent', 'student'],
        required: true,
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    receiverType: {
        type: String,
        enum: ['admin', 'teacher', 'parent', 'student'],
        required: true,
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    subject: {
        type: String,
        maxlength: 200,
        default: null,
    },
    content: {
        type: String,
        required: true,
    },
    messageType: {
        type: String,
        enum: ['general', 'progress_update', 'assignment_notification', 'meeting_request', 'announcement'],
        default: 'general',
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    readAt: {
        type: Date,
        default: null,
    },
    attachments: {
        type: [String], // array of file URLs
        default: [],
    },
    relatedStudentId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: 'Student',
    }
}, {
    timestamps: true,
    collection: 'messages'
});

messageSchema.index({ senderId: 1 });
messageSchema.index({ receiverId: 1 });
messageSchema.index({ messageType: 1 });
messageSchema.index({ isRead: 1 });
messageSchema.index({ relatedStudentId: 1 });

module.exports = mongoose.model('Message', messageSchema);
