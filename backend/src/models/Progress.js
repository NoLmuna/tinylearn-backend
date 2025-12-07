/* eslint-disable no-undef */
const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Student',
    },
    lessonId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Lesson',
    },
    status: {
        type: String,
        enum: ['not_started', 'in_progress', 'completed'],
        default: 'not_started',
    },
    score: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
    },
    timeSpent: {
        type: Number, // in minutes
        default: 0,
    },
    completedAt: {
        type: Date,
        default: null,
    },
    notes: {
        type: String,
        default: null,
    }
}, {
    timestamps: true,
    collection: 'progress'
});

progressSchema.index({ studentId: 1, lessonId: 1 }, { unique: true });
progressSchema.index({ studentId: 1 });
progressSchema.index({ lessonId: 1 });
progressSchema.index({ status: 1 });

module.exports = mongoose.model('Progress', progressSchema);
