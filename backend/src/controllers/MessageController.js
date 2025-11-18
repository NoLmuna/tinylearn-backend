const { Message, Admin, Teacher, Parent, Student } = require('../models');
const send = require('../utils/response');
const { Op } = require('sequelize');

const ROLE_MODELS = {
    admin: Admin,
    teacher: Teacher,
    parent: Parent,
    student: Student
};

const ALLOWED_ROLES = Object.keys(ROLE_MODELS);

const findUserByRole = async (role, id) => {
    const Model = ROLE_MODELS[role];
    if (!Model) return null;
    return Model.findByPk(id, {
        attributes: ['id', 'firstName', 'lastName', 'email']
    });
};

const hydrateMessages = async (messages) => {
    const cache = {
        admin: new Map(),
        teacher: new Map(),
        parent: new Map(),
        student: new Map()
    };

    const getActor = async (role, id) => {
        if (!role || !id) return null;
        if (cache[role].has(id)) {
            return cache[role].get(id);
        }
        const entity = await findUserByRole(role, id);
        cache[role].set(id, entity);
        return entity;
    };

    return Promise.all(messages.map(async (message) => ({
        ...message.toJSON(),
        sender: await getActor(message.senderType, message.senderId),
        receiver: await getActor(message.receiverType, message.receiverId)
    })));
};

const MessageController = {
    async sendMessage(req, res) {
        try {
            const { receiverId, receiverType, content, relatedStudentId, subject, priority } = req.body;
            const senderId = req.user?.userId || req.user?.id;
            const senderType = req.user?.role;

            if (!senderId || !senderType) {
                return send.sendResponseMessage(res, 401, null, 'User identity missing from token');
            }

            if (!receiverId || !receiverType || !content) {
                return send.sendResponseMessage(res, 400, null, 'Receiver, receiver type, and content are required');
            }

            if (!ALLOWED_ROLES.includes(receiverType)) {
                return send.sendResponseMessage(res, 400, null, 'Invalid receiver type');
            }

            const receiver = await findUserByRole(receiverType, receiverId);
            if (!receiver) {
                return send.sendResponseMessage(res, 404, null, 'Receiver not found');
            }

            let relatedStudent = null;
            if (relatedStudentId) {
                relatedStudent = await Student.findByPk(relatedStudentId);
                if (!relatedStudent) {
                    return send.sendResponseMessage(res, 404, null, 'Related student not found');
                }
            }

            const message = await Message.create({
                senderId,
                senderType,
                receiverId,
                receiverType,
                content,
                subject,
                priority,
                relatedStudentId: relatedStudent ? relatedStudent.id : null
            });

            const hydrated = await hydrateMessages([message]);

            if (req.app.get('io')) {
                req.app.get('io').emit('newMessage', hydrated[0]);
            }

            return send.sendResponseMessage(res, 201, hydrated[0], 'Message sent successfully');
        } catch (error) {
            console.error('Error sending message:', error);
            return send.sendResponseMessage(res, 500, null, 'Failed to send message');
        }
    },

    async getMessages(req, res) {
        try {
            const userId = req.user?.userId || req.user?.id;
            const userRole = req.user?.role;
            const { otherUserId } = req.params;
            const { otherRole } = req.query;

            if (!userId || !userRole) {
                return send.sendResponseMessage(res, 401, null, 'User identity missing from token');
            }

            if (!otherUserId || !otherRole) {
                return send.sendResponseMessage(res, 400, null, 'Other user ID and role are required');
            }

            const parsedOtherId = parseInt(otherUserId, 10);
            if (Number.isNaN(parsedOtherId)) {
                return send.sendResponseMessage(res, 400, null, 'Invalid other user ID');
            }

            if (!ALLOWED_ROLES.includes(otherRole)) {
                return send.sendResponseMessage(res, 400, null, 'Invalid other user role');
            }

            const messages = await Message.findAll({
                where: {
                    [Op.or]: [
                        { senderId: userId, senderType: userRole, receiverId: parsedOtherId, receiverType: otherRole },
                        { senderId: parsedOtherId, senderType: otherRole, receiverId: userId, receiverType: userRole }
                    ]
                },
                order: [['createdAt', 'ASC']]
            });

            const hydrated = await hydrateMessages(messages);
            return send.sendResponseMessage(res, 200, hydrated, 'Messages retrieved successfully');
        } catch (error) {
            console.error('Error getting messages:', error);
            return send.sendResponseMessage(res, 500, null, 'Failed to retrieve messages');
        }
    },

    async getConversations(req, res) {
        try {
            const userId = req.user?.userId || req.user?.id;
            const userRole = req.user?.role;

            if (!userId || !userRole) {
                return send.sendResponseMessage(res, 401, null, 'User identity missing from token');
            }

            const conversations = await Message.findAll({
                where: {
                    [Op.or]: [
                        { senderId: userId, senderType: userRole },
                        { receiverId: userId, receiverType: userRole }
                    ]
                },
                order: [['createdAt', 'DESC']]
            });

            const conversationMap = new Map();

            for (const message of conversations) {
                const isSender = message.senderId === userId && message.senderType === userRole;
                const partnerId = isSender ? message.receiverId : message.senderId;
                const partnerRole = isSender ? message.receiverType : message.senderType;
                const key = `${partnerRole}:${partnerId}`;

                if (!conversationMap.has(key)) {
                    const partner = await findUserByRole(partnerRole, partnerId);
                    conversationMap.set(key, {
                        partnerId,
                        partnerRole,
                        partner,
                        lastMessage: message,
                        unreadCount: 0
                    });
                }
            }

            const results = [];
            for (const convo of conversationMap.values()) {
                const [hydratedLastMessage] = await hydrateMessages([convo.lastMessage]);
                results.push({
                    partnerId: convo.partnerId,
                    partnerRole: convo.partnerRole,
                    partner: convo.partner,
                    lastMessage: hydratedLastMessage,
                    unreadCount: convo.unreadCount
                });
            }

            return send.sendResponseMessage(res, 200, results, 'Conversations retrieved successfully');
        } catch (error) {
            console.error('Error getting conversations:', error);
            return send.sendResponseMessage(res, 500, null, 'Failed to retrieve conversations');
        }
    }
};

module.exports = MessageController;
