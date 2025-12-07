/* eslint-disable no-undef */
const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100,
    },
    description: {
        type: String,
        default: null,
    },
    content: {
        type: String,
        default: null,
    },
    category: {
        type: String,
        enum: ['math', 'reading', 'science', 'art', 'music', 'physical', 'social'],
        required: true,
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner',
    },
    ageGroup: {
        type: String,
        required: true,
        trim: true,
    },
    duration: {
        type: Number, // in minutes
        min: 1,
        max: 300,
        default: null,
    },
    imageUrl: {
        type: String,
        default: null,
    },
    videoUrl: {
        type: String,
        default: null,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Teacher',
    }
}, {
    timestamps: true,
    collection: 'lessons'
});

lessonSchema.index({ category: 1 });
lessonSchema.index({ difficulty: 1 });
lessonSchema.index({ ageGroup: 1 });

module.exports = mongoose.model('Lesson', lessonSchema);
