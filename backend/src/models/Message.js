/* eslint-disable no-undef */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Message = sequelize.define('Message', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        senderType: {
            type: DataTypes.ENUM('admin', 'teacher', 'parent', 'student'),
            allowNull: false,
            field: 'sender_type'
        },
        senderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'sender_id'
        },
        receiverType: {
            type: DataTypes.ENUM('admin', 'teacher', 'parent', 'student'),
            allowNull: false,
            field: 'receiver_type'
        },
        receiverId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'receiver_id'
        },
        subject: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                len: [0, 200]
            }
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        messageType: {
            type: DataTypes.ENUM('general', 'progress_update', 'assignment_notification', 'meeting_request', 'announcement'),
            defaultValue: 'general',
            field: 'message_type'
        },
        priority: {
            type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
            defaultValue: 'medium'
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_read'
        },
        readAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'read_at'
        },
        attachments: {
            type: DataTypes.TEXT, // JSON array of file URLs
            allowNull: true,
            get() {
                const rawValue = this.getDataValue('attachments');
                return rawValue ? JSON.parse(rawValue) : [];
            },
            set(value) {
                this.setDataValue('attachments', JSON.stringify(value));
            }
        },
        relatedStudentId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'related_student_id',
            references: {
                model: 'students',
                key: 'id'
            }
        }
    }, {
        tableName: 'messages',
        timestamps: true,
        indexes: [
            {
                fields: ['sender_id']
            },
            {
                fields: ['receiver_id']
            },
            {
                fields: ['message_type']
            },
            {
                fields: ['is_read']
            },
            {
                fields: ['related_student_id']
            }
        ]
    });

    return Message;
};
