/* eslint-disable no-undef */
const mongoose = require('mongoose');

const studentParentSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Student',
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Parent',
    },
    relationship: {
        type: String,
        enum: ['mother', 'father', 'guardian', 'grandmother', 'grandfather', 'other'],
        default: 'guardian',
    },
    isPrimary: {
        type: Boolean,
        default: false,
    },
    canReceiveMessages: {
        type: Boolean,
        default: true,
    },
    canViewProgress: {
        type: Boolean,
        default: true,
    }
}, {
    timestamps: true,
    collection: 'student_parents'
});

studentParentSchema.index({ studentId: 1, parentId: 1 }, { unique: true });
studentParentSchema.index({ studentId: 1 });
studentParentSchema.index({ parentId: 1 });

module.exports = mongoose.model('StudentParent', studentParentSchema);
