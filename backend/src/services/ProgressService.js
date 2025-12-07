/* eslint-disable no-undef */
/**
 * Progress Service
 * Computes student progress based on lessons viewed and assignments submitted
 */

const { Progress, Lesson, Submission, Assignment, Student } = require('../models/database');
const { Op } = require('sequelize');

class ProgressService {
    /**
     * Calculate comprehensive progress for a student
     * @param {number} studentId - Student ID
     * @returns {Object} Progress statistics
     */
    static async calculateStudentProgress(studentId) {
        try {
            // Get all lessons viewed (any status)
            const lessonsViewed = await Progress.count({
                where: {
                    studentId,
                    status: {
                        [Op.in]: ['in_progress', 'completed']
                    }
                }
            });

            // Get completed lessons
            const lessonsCompleted = await Progress.count({
                where: {
                    studentId,
                    status: 'completed'
                }
            });

            // Get total active lessons
            const totalLessons = await Lesson.count({
                where: { isActive: true }
            });

            // Get assignments submitted
            const assignmentsSubmitted = await Submission.count({
                where: {
                    studentId,
                    status: {
                        [Op.in]: ['submitted', 'graded']
                    }
                },
                include: [
                    {
                        model: Assignment,
                        as: 'assignment',
                        where: { isActive: true },
                        required: true
                    }
                ]
            });

            // Get assignments graded
            const assignmentsGraded = await Submission.count({
                where: {
                    studentId,
                    status: 'graded'
                },
                include: [
                    {
                        model: Assignment,
                        as: 'assignment',
                        where: { isActive: true },
                        required: true
                    }
                ]
            });

            // Get total assignments assigned to student
            const { TeacherStudent } = require('../models/database');
            const teacherAssignments = await TeacherStudent.findAll({
                where: { studentId },
                attributes: ['teacherId']
            });
            const teacherIds = teacherAssignments.map(ta => ta.teacherId);

            const totalAssignments = await Assignment.count({
                where: {
                    isActive: true,
                    [Op.or]: [
                        // Specifically assigned to this student
                        Assignment.sequelize.where(
                            Assignment.sequelize.fn('JSON_CONTAINS',
                                Assignment.sequelize.col('assigned_to'),
                                JSON.stringify(studentId)
                            ),
                            true
                        ),
                        // Assigned to all students (empty array) and teacher matches
                        {
                            [Op.and]: [
                                Assignment.sequelize.where(
                                    Assignment.sequelize.fn('JSON_LENGTH',
                                        Assignment.sequelize.col('assigned_to')
                                    ),
                                    0
                                ),
                                { teacherId: { [Op.in]: teacherIds } }
                            ]
                        }
                    ]
                }
            });

            // Calculate average scores
            const completedProgress = await Progress.findAll({
                where: {
                    studentId,
                    status: 'completed',
                    score: { [Op.ne]: null }
                },
                attributes: ['score']
            });

            const gradedSubmissions = await Submission.findAll({
                where: {
                    studentId,
                    status: 'graded',
                    score: { [Op.ne]: null }
                },
                attributes: ['score'],
                include: [
                    {
                        model: Assignment,
                        as: 'assignment',
                        attributes: ['maxPoints']
                    }
                ]
            });

            // Calculate lesson average score
            let lessonAverageScore = 0;
            if (completedProgress.length > 0) {
                const totalScore = completedProgress.reduce((sum, p) => sum + (p.score || 0), 0);
                lessonAverageScore = totalScore / completedProgress.length;
            }

            // Calculate assignment average score (as percentage)
            let assignmentAverageScore = 0;
            if (gradedSubmissions.length > 0) {
                const totalPercentage = gradedSubmissions.reduce((sum, sub) => {
                    const percentage = sub.assignment ? (sub.score / sub.assignment.maxPoints) * 100 : 0;
                    return sum + percentage;
                }, 0);
                assignmentAverageScore = totalPercentage / gradedSubmissions.length;
            }

            // Calculate overall progress percentage
            const lessonProgress = totalLessons > 0 ? (lessonsCompleted / totalLessons) * 100 : 0;
            const assignmentProgress = totalAssignments > 0 ? (assignmentsSubmitted / totalAssignments) * 100 : 0;
            
            // Weighted average: 60% lessons, 40% assignments
            const overallProgress = (lessonProgress * 0.6) + (assignmentProgress * 0.4);

            // Calculate overall average score
            const totalItems = completedProgress.length + gradedSubmissions.length;
            const overallAverageScore = totalItems > 0
                ? ((lessonAverageScore * completedProgress.length) + (assignmentAverageScore * gradedSubmissions.length)) / totalItems
                : 0;

            // Get time spent on lessons
            const totalTimeSpent = await Progress.sum('timeSpent', {
                where: { studentId }
            }) || 0;

            return {
                lessons: {
                    viewed: lessonsViewed,
                    completed: lessonsCompleted,
                    total: totalLessons,
                    completionRate: totalLessons > 0 ? ((lessonsCompleted / totalLessons) * 100).toFixed(2) : 0,
                    averageScore: lessonAverageScore.toFixed(2)
                },
                assignments: {
                    submitted: assignmentsSubmitted,
                    graded: assignmentsGraded,
                    total: totalAssignments,
                    submissionRate: totalAssignments > 0 ? ((assignmentsSubmitted / totalAssignments) * 100).toFixed(2) : 0,
                    averageScore: assignmentAverageScore.toFixed(2)
                },
                overall: {
                    progress: overallProgress.toFixed(2),
                    averageScore: overallAverageScore.toFixed(2),
                    totalTimeSpent: totalTimeSpent // in minutes
                }
            };
        } catch (error) {
            console.error('Error calculating student progress:', error);
            throw error;
        }
    }

    /**
     * Get detailed progress breakdown for a student
     * @param {number} studentId - Student ID
     * @returns {Object} Detailed progress data
     */
    static async getDetailedProgress(studentId) {
        try {
            const progress = await this.calculateStudentProgress(studentId);

            // Get recent lessons progress
            const recentLessons = await Progress.findAll({
                where: { studentId },
                include: [
                    {
                        model: Lesson,
                        as: 'lesson',
                        attributes: ['id', 'title', 'category', 'difficulty']
                    }
                ],
                order: [['updatedAt', 'DESC']],
                limit: 10
            });

            // Get recent submissions
            const recentSubmissions = await Submission.findAll({
                where: { studentId },
                include: [
                    {
                        model: Assignment,
                        as: 'assignment',
                        attributes: ['id', 'title', 'assignmentType']
                    }
                ],
                order: [['submittedAt', 'DESC']],
                limit: 10
            });

            return {
                ...progress,
                recentActivity: {
                    lessons: recentLessons,
                    submissions: recentSubmissions
                }
            };
        } catch (error) {
            console.error('Error getting detailed progress:', error);
            throw error;
        }
    }

    /**
     * Get progress for multiple students (for teachers/parents)
     * @param {Array<number>} studentIds - Array of student IDs
     * @returns {Array<Object>} Progress data for each student
     */
    static async getMultipleStudentsProgress(studentIds) {
        try {
            const progressPromises = studentIds.map(id => this.calculateStudentProgress(id));
            const progressResults = await Promise.all(progressPromises);

            // Get student names
            const students = await Student.findAll({
                where: { id: { [Op.in]: studentIds } },
                attributes: ['id', 'firstName', 'lastName', 'grade']
            });

            return progressResults.map((progress, index) => ({
                studentId: studentIds[index],
                student: students.find(s => s.id === studentIds[index]),
                ...progress
            }));
        } catch (error) {
            console.error('Error getting multiple students progress:', error);
            throw error;
        }
    }
}

module.exports = ProgressService;

