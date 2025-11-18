/* eslint-disable no-undef */
require('dotenv').config();
const { 
    Admin, 
    Teacher, 
    Parent, 
    Student, 
    Lesson, 
    Assignment, 
    Progress,
    Submission,
    Achievement,
    Message,
    StudentParent 
} = require('./src/models/database');
const argon2 = require('argon2');

/**
 * Database seeding script for TinyLearn
 */
const seedData = async () => {
    try {
        console.log('🌱 Starting to seed database...\n');

        const createUser = async (Model, data) => {
            const password = await argon2.hash(data.password);
            const [record] = await Model.findOrCreate({
                where: { email: data.email },
                defaults: { ...data, password }
            });
            return record;
        };

        // Admins
        console.log('👩‍💼 Seeding admins...');
        const admins = await Promise.all([
            createUser(Admin, {
                firstName: 'Alice',
                lastName: 'Anderson',
                email: 'admin@tinylearn.com',
                password: 'Admin123!',
                accountStatus: 'active',
                isSuperAdmin: true
            }),
            createUser(Admin, {
                firstName: 'Brian',
                lastName: 'Baker',
                email: 'ops@tinylearn.com',
                password: 'AdminOps123!',
                accountStatus: 'active',
                isSuperAdmin: false
            })
        ]);

        // Teachers
        console.log('👩‍🏫 Seeding teachers...');
        const teachers = await Promise.all([
            createUser(Teacher, {
                firstName: 'Sarah',
                lastName: 'Johnson',
                email: 'teacher1@tinylearn.com',
                password: 'Teacher123!',
                accountStatus: 'approved',
                bio: 'Early childhood educator with 8 years of experience.',
                subjectSpecialty: 'Mathematics'
            }),
            createUser(Teacher, {
                firstName: 'Daniel',
                lastName: 'Lopez',
                email: 'teacher2@tinylearn.com',
                password: 'Teacher456!',
                accountStatus: 'approved',
                bio: 'Creative arts and music specialist.',
                subjectSpecialty: 'Arts'
            })
        ]);

        // Parents
        console.log('👪 Seeding parents...');
        const parents = await Promise.all([
            createUser(Parent, {
                firstName: 'Michael',
                lastName: 'Smith',
                email: 'parent1@tinylearn.com',
                password: 'Parent123!',
                relationship: 'father',
                phoneNumber: '555-1001',
                accountStatus: 'active'
            }),
            createUser(Parent, {
                firstName: 'Laura',
                lastName: 'Kim',
                email: 'parent2@tinylearn.com',
                password: 'Parent456!',
                relationship: 'mother',
                phoneNumber: '555-1002',
                accountStatus: 'active'
            })
        ]);

        // Students
        console.log('👧 Seeding students...');
        const students = await Promise.all([
            createUser(Student, {
                firstName: 'Emma',
                lastName: 'Smith',
                email: 'student1@tinylearn.com',
                password: 'Student123!',
                age: 6,
                grade: '1st Grade',
                accountStatus: 'active'
            }),
            createUser(Student, {
                firstName: 'Noah',
                lastName: 'Smith',
                email: 'student2@tinylearn.com',
                password: 'Student456!',
                age: 8,
                grade: '3rd Grade',
                accountStatus: 'active'
            }),
            createUser(Student, {
                firstName: 'Olivia',
                lastName: 'Kim',
                email: 'student3@tinylearn.com',
                password: 'Student789!',
                age: 7,
                grade: '2nd Grade',
                accountStatus: 'active'
            })
        ]);

        // Parent-student relationships
        console.log('🔗 Linking parents and students...');
        const relations = [
            { student: students[0], parent: parents[0], relationship: 'father' },
            { student: students[1], parent: parents[0], relationship: 'father' },
            { student: students[2], parent: parents[1], relationship: 'mother' }
        ];

        await Promise.all(relations.map(relation =>
            StudentParent.findOrCreate({
                where: {
                    studentId: relation.student.id,
                    parentId: relation.parent.id
                },
                defaults: {
                    studentId: relation.student.id,
                    parentId: relation.parent.id,
                    relationship: relation.relationship,
                    isPrimary: true,
                    canReceiveMessages: true,
                    canViewProgress: true
                }
            })
        ));

        // Lessons
        console.log('📚 Creating lessons...');
        const lessonTemplates = [
            {
                teacher: teachers[0],
                lessons: [
                    {
                        title: 'Learning Numbers 1-10',
                        category: 'math',
                        difficulty: 'beginner',
                        ageGroup: '4-6 years',
                        duration: 20
                    },
                    {
                        title: 'Simple Addition',
                        category: 'math',
                        difficulty: 'intermediate',
                        ageGroup: '6-8 years',
                        duration: 30
                    }
                ]
            },
            {
                teacher: teachers[1],
                lessons: [
                    {
                        title: 'Primary Colors Exploration',
                        category: 'art',
                        difficulty: 'beginner',
                        ageGroup: '3-5 years',
                        duration: 15
                    },
                    {
                        title: 'Animal Sounds and Names',
                        category: 'science',
                        difficulty: 'beginner',
                        ageGroup: '4-6 years',
                        duration: 25
                    }
                ]
            }
        ];

        const lessons = [];
        for (const template of lessonTemplates) {
            for (const detail of template.lessons) {
                const [lesson] = await Lesson.findOrCreate({
                    where: { title: detail.title },
                    defaults: {
                        ...detail,
                        description: `Lesson on ${detail.title.toLowerCase()}.`,
                        content: `Full lesson plan for ${detail.title}.`,
                        teacherId: template.teacher.id,
                        isActive: true
                    }
                });
                lessons.push(lesson);
            }
        }

        // Assignments
        console.log('📝 Creating assignments...');
        const assignments = [];
        for (const lesson of lessons) {
            const teacher = teachers.find(t => t.id === lesson.teacherId);
            const studentIds = students
                .filter((_, index) => index % teachers.length === teachers.indexOf(teacher))
                .map(s => s.id) || students.map(s => s.id);

            const [assignment] = await Assignment.findOrCreate({
                where: { title: `${lesson.title} Assignment` },
                defaults: {
                    title: `${lesson.title} Assignment`,
                    description: `Complete the follow-up activity for ${lesson.title}.`,
                    instructions: 'Follow the instructions carefully and submit before the due date.',
                    teacherId: teacher.id,
                    lessonId: lesson.id,
                    assignedTo: studentIds,
                    dueDate: new Date(Date.now() + (3 + assignments.length) * 24 * 60 * 60 * 1000),
                    maxPoints: 100,
                    assignmentType: 'worksheet',
                    isActive: true
                }
            });
            assignments.push(assignment);
        }

        // Progress entries
        console.log('📈 Creating progress entries...');
        await Promise.all(students.flatMap(student =>
            lessons.map((lesson, idx) =>
                Progress.findOrCreate({
                    where: {
                        studentId: student.id,
                        lessonId: lesson.id
                    },
                    defaults: {
                        studentId: student.id,
                        lessonId: lesson.id,
                        status: idx % 3 === 0 ? 'completed' : (idx % 3 === 1 ? 'in_progress' : 'not_started'),
                        score: idx % 3 === 0 ? 90 : null,
                        timeSpent: (idx + 1) * 5,
                        completedAt: idx % 3 === 0 ? new Date() : null
                    }
                })
            )
        ));

        // Submissions
        console.log('📤 Creating submissions...');
        await Promise.all(assignments.flatMap(assignment =>
            students.map((student, idx) =>
                Submission.findOrCreate({
                    where: {
                        assignmentId: assignment.id,
                        studentId: student.id
                    },
                    defaults: {
                        assignmentId: assignment.id,
                        studentId: student.id,
                        content: `Submission content for ${assignment.title} by ${student.firstName}.`,
                        attachments: [],
                        status: idx % 2 === 0 ? 'graded' : 'submitted',
                        score: idx % 2 === 0 ? 85 + idx : null,
                        feedback: idx % 2 === 0 ? 'Great job!' : null,
                        submittedAt: new Date(),
                        gradedAt: idx % 2 === 0 ? new Date() : null,
                        gradedBy: assignment.teacherId
                    }
                })
            )
        ));

        // Achievements
        console.log('🏅 Creating achievements...');
        await Promise.all(students.map((student, idx) =>
            Achievement.findOrCreate({
                where: {
                    studentId: student.id,
                    title: `Milestone ${idx + 1}`
                },
                defaults: {
                    studentId: student.id,
                    title: `Milestone ${idx + 1}`,
                    description: `Awarded for completing ${idx + 1} lessons.`,
                    badgeIcon: '🌟',
                    badgeColor: '#fbbf24',
                    achievementType: 'completion',
                    category: 'general',
                    points: 50,
                    relatedLessonId: lessons[idx % lessons.length].id,
                    earnedAt: new Date()
                }
            })
        ));

        // Messages
        console.log('💬 Creating messages...');
        const sampleMessages = [
            {
                senderType: 'teacher',
                senderId: teachers[0].id,
                receiverType: 'parent',
                receiverId: parents[0].id,
                subject: 'Progress Update',
                content: 'Emma is doing great in math! Keep up the support at home.',
                relatedStudentId: students[0].id,
                priority: 'medium'
            },
            {
                senderType: 'parent',
                senderId: parents[1].id,
                receiverType: 'teacher',
                receiverId: teachers[1].id,
                subject: 'Question About Assignment',
                content: 'Could you clarify the instructions for Olivia’s art project?',
                relatedStudentId: students[2].id,
                priority: 'low'
            },
            {
                senderType: 'admin',
                senderId: admins[0].id,
                receiverType: 'teacher',
                receiverId: teachers[0].id,
                subject: 'System Maintenance',
                content: 'Reminder: The system will undergo maintenance this weekend.',
                relatedStudentId: null,
                priority: 'high'
            }
        ];

        await Promise.all(sampleMessages.map(message =>
            Message.create({
                ...message,
                messageType: 'general',
                isRead: false
            })
        ));

        console.log('\n✅ Database seeded successfully!');
        console.log('\n🔐 Test Login Credentials:');
        console.log('   👩‍💼 Admin: admin@tinylearn.com / Admin123!');
        console.log('   👩‍🏫 Teacher: teacher1@tinylearn.com / Teacher123!');
        console.log('   👨‍👩‍👧 Parent: parent1@tinylearn.com / Parent123!');
        console.log('   👧 Student: student1@tinylearn.com / Student123!');
        console.log('\n🎯 Ready to start TinyLearn!');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    }
};

// Export for programmatic use
module.exports = seedData;

// Run if called directly
if (require.main === module) {
    seedData()
        .then(() => {
            console.log('🎉 Seeding completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Seeding failed:', error);
            process.exit(1);
        });
}
