/* eslint-disable no-undef */
const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
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
    lessonId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: 'Lesson',
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Teacher',
    },
    assignedTo: {
        type: [mongoose.Schema.Types.ObjectId],
        required: true,
        ref: 'Student',
    },
    dueDate: {
        type: Date,
        required: true,
    },
    maxPoints: {
        type: Number,
        required: true,
        default: 100,
        min: 1,
        max: 1000,
    },
    assignmentType: {
        type: String,
        enum: ['homework', 'quiz', 'project', 'reading', 'practice'],
        required: true,
        default: 'homework',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    attachments: {
        type: [String], // array of file URLs
        default: [],
    }
}, {
    timestamps: true,
    collection: 'assignments'
});

assignmentSchema.index({ teacherId: 1 });
assignmentSchema.index({ dueDate: 1 });
assignmentSchema.index({ assignmentType: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
