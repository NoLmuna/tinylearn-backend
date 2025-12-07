/* eslint-disable no-undef */
const dbconfig = require('../config/config');
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(dbconfig.database, dbconfig.user, dbconfig.password, {
    host: dbconfig.host,
    dialect: dbconfig.dialect,
    logging: false, // Disable SQL logging in production
    pool: {
        max: 10,
        min: 2,
        acquire: 30000,
        idle: 10000
    },
    dialectOptions: {
        connectTimeout: 10000 // 10 seconds connection timeout
    },
    retry: {
        max: 3 // Retry failed queries up to 3 times
    }
});

sequelize.authenticate()
.then(() => console.log('✅ Database connected successfully!'))
.catch(err => console.log('❌ Database connection error:', err));

// Import model functions
const AdminModel = require('./Admin');
const TeacherModel = require('./Teacher');
const StudentModel = require('./Student');
const ParentModel = require('./Parent');
const LessonModel = require('./Lesson');
const ProgressModel = require('./Progress');
const AssignmentModel = require('./Assignment');
const SubmissionModel = require('./Submission');
const MessageModel = require('./Message');
const StudentParentModel = require('./StudentParent');
const TeacherStudentModel = require('./TeacherStudent');
const AchievementModel = require('./Achievement');
const AssignmentAnswerModel = require('./AssignmentAnswer');

// Initialize models
const Admin = AdminModel(sequelize);
const Teacher = TeacherModel(sequelize);
const Student = StudentModel(sequelize);
const Parent = ParentModel(sequelize);
const Lesson = LessonModel(sequelize);
const Progress = ProgressModel(sequelize);
const Assignment = AssignmentModel(sequelize);
const Submission = SubmissionModel(sequelize);
const Message = MessageModel(sequelize);
const StudentParent = StudentParentModel(sequelize);
const TeacherStudent = TeacherStudentModel(sequelize);
const Achievement = AchievementModel(sequelize);
const AssignmentAnswer = AssignmentAnswerModel(sequelize);

// Set up associations
// Teacher and Lesson associations
Teacher.hasMany(Lesson, {
    foreignKey: 'teacherId',
    as: 'lessons'
});

Lesson.belongsTo(Teacher, {
    foreignKey: 'teacherId',
    as: 'teacher'
});

// Student and Progress associations
Student.hasMany(Progress, {
    foreignKey: 'studentId',
    as: 'progress'
});

Progress.belongsTo(Student, {
    foreignKey: 'studentId',
    as: 'student'
});

// Lesson and Progress associations
Lesson.hasMany(Progress, {
    foreignKey: 'lessonId',
    as: 'progress'
});

Progress.belongsTo(Lesson, {
    foreignKey: 'lessonId',
    as: 'lesson'
});

// Assignment associations
Teacher.hasMany(Assignment, {
    foreignKey: 'teacherId',
    as: 'createdAssignments'
});

Assignment.belongsTo(Teacher, {
    foreignKey: 'teacherId',
    as: 'teacher'
});

Lesson.hasMany(Assignment, {
    foreignKey: 'lessonId',
    as: 'assignments'
});

Assignment.belongsTo(Lesson, {
    foreignKey: 'lessonId',
    as: 'lesson'
});

// Submission associations
Assignment.hasMany(Submission, {
    foreignKey: 'assignmentId',
    as: 'submissions'
});

Submission.belongsTo(Assignment, {
    foreignKey: 'assignmentId',
    as: 'assignment'
});

Student.hasMany(Submission, {
    foreignKey: 'studentId',
    as: 'submissions'
});

Submission.belongsTo(Student, {
    foreignKey: 'studentId',
    as: 'student'
});

Teacher.hasMany(Submission, {
    foreignKey: 'gradedBy',
    as: 'gradedSubmissions'
});

Submission.belongsTo(Teacher, {
    foreignKey: 'gradedBy',
    as: 'grader'
});

// Student-Parent associations
Student.hasMany(StudentParent, {
    foreignKey: 'studentId',
    as: 'parentRelations'
});

StudentParent.belongsTo(Student, {
    foreignKey: 'studentId',
    as: 'student'
});

Parent.hasMany(StudentParent, {
    foreignKey: 'parentId',
    as: 'childrenRelations'
});

StudentParent.belongsTo(Parent, {
    foreignKey: 'parentId',
    as: 'parent'
});

// Achievement associations
Student.hasMany(Achievement, {
    foreignKey: 'studentId',
    as: 'achievements'
});

Achievement.belongsTo(Student, {
    foreignKey: 'studentId',
    as: 'student'
});

Lesson.hasMany(Achievement, {
    foreignKey: 'relatedLessonId',
    as: 'achievements'
});

Achievement.belongsTo(Lesson, {
    foreignKey: 'relatedLessonId',
    as: 'relatedLesson'
});

Assignment.hasMany(Achievement, {
    foreignKey: 'relatedAssignmentId',
    as: 'achievements'
});

Achievement.belongsTo(Assignment, {
    foreignKey: 'relatedAssignmentId',
    as: 'relatedAssignment'
});

// Teacher-Student associations
Teacher.belongsToMany(Student, {
    through: TeacherStudent,
    foreignKey: 'teacherId',
    otherKey: 'studentId',
    as: 'students'
});

Student.belongsToMany(Teacher, {
    through: TeacherStudent,
    foreignKey: 'studentId',
    otherKey: 'teacherId',
    as: 'teachers'
});

Teacher.hasMany(TeacherStudent, {
    foreignKey: 'teacherId',
    as: 'studentAssignments'
});

TeacherStudent.belongsTo(Teacher, {
    foreignKey: 'teacherId',
    as: 'teacher'
});

Student.hasMany(TeacherStudent, {
    foreignKey: 'studentId',
    as: 'teacherAssignments'
});

TeacherStudent.belongsTo(Student, {
    foreignKey: 'studentId',
    as: 'student'
});

// AssignmentAnswer associations
Assignment.hasMany(AssignmentAnswer, {
    foreignKey: 'assignmentId',
    as: 'answers'
});

AssignmentAnswer.belongsTo(Assignment, {
    foreignKey: 'assignmentId',
    as: 'assignment'
});

Student.hasMany(AssignmentAnswer, {
    foreignKey: 'studentId',
    as: 'assignmentAnswers'
});

AssignmentAnswer.belongsTo(Student, {
    foreignKey: 'studentId',
    as: 'student'
});

sequelize.sync({ force: false })
.then(() => console.log('✅ Database synced successfully!'))
.catch((error) => console.error('❌ Error during database sync:', error));

// Export models and sequelize instance
const db = {
    sequelize,
    Admin,
    Teacher,
    Student,
    Parent,
    Lesson,
    Progress,
    Assignment,
    Submission,
    Message,
    StudentParent,
    Achievement,
    TeacherStudent,
    AssignmentAnswer
};

module.exports = db;