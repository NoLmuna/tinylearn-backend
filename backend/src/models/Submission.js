/* eslint-disable no-undef */
const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Assignment',
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Student',
    },
    content: {
        type: String,
        default: null,
    },
    attachments: {
        type: [String], // array of file URLs
        default: [],
    },
    status: {
        type: String,
        enum: ['draft', 'submitted', 'graded', 'returned'],
        default: 'draft',
    },
    score: {
        type: Number,
        min: 0,
        default: null,
    },
    feedback: {
        type: String,
        default: null,
    },
    submittedAt: {
        type: Date,
        default: null,
    },
    gradedAt: {
        type: Date,
        default: null,
    },
    gradedBy: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: 'Teacher',
    },
    timeSpent: {
        type: Number, // in minutes
        default: 0,
    }
}, {
    timestamps: true,
    collection: 'submissions'
});

submissionSchema.index({ assignmentId: 1 });
submissionSchema.index({ studentId: 1 });
submissionSchema.index({ status: 1 });
submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
