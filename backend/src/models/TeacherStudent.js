/* eslint-disable no-undef */
const mongoose = require('mongoose');

const teacherStudentSchema = new mongoose.Schema({
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Teacher',
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Student',
    }
}, {
    timestamps: true,
    collection: 'teacher_students'
});

teacherStudentSchema.index({ teacherId: 1, studentId: 1 }, { unique: true });
teacherStudentSchema.index({ teacherId: 1 });
teacherStudentSchema.index({ studentId: 1 });

module.exports = mongoose.model('TeacherStudent', teacherStudentSchema);
