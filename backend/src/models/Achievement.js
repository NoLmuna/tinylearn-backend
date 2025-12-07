/* eslint-disable no-undef */
const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Student',
    },
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100,
    },
    description: {
        type: String,
        required: true,
    },
    badgeIcon: {
        type: String,
        default: null,
    },
    badgeColor: {
        type: String,
        default: '#3B82F6',
    },
    achievementType: {
        type: String,
        enum: ['completion', 'streak', 'score', 'participation', 'improvement', 'special'],
        required: true,
    },
    category: {
        type: String,
        default: null, // e.g., 'math', 'reading', 'general'
    },
    points: {
        type: Number,
        required: true,
        default: 10,
        min: 1,
        max: 1000,
    },
    earnedAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    relatedLessonId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: 'Lesson',
    },
    relatedAssignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: 'Assignment',
    }
}, {
    timestamps: true,
    collection: 'achievements'
});

achievementSchema.index({ studentId: 1 });
achievementSchema.index({ achievementType: 1 });
achievementSchema.index({ category: 1 });
achievementSchema.index({ earnedAt: 1 });

module.exports = mongoose.model('Achievement', achievementSchema);
