import { Router } from "express";
import { upload } from "../utils/index.mjs";
import { sendMessage, getMessagesFromConversation, addSeenToConversation, checkUnseenMessages, getMoreMessages, addUserToConversation, removeUserFromConversation, createConversation, updateConversation, getAllConversations, getMessagesByUser, sendFile, getFilesInConversation, getAllUsersInConversation, getMessagesFromCommunication, getMediaInConversation, getDocsInConversation, getMessagesByConversation, manageFriendShip, getSendRequests, getReceiveRequests, statusFriendShip, getBlockedUsers, getContactUsers, getAllUsers, createGroup, getAllConversationsWhereAdmin } from "../handlers/chat.mjs";
import eventEmitter from "../../emitter.js";
import path from 'path';
import { __dirname } from "../../index.js";
import { authenticateUser } from "../utils/middlewares.js";

const router = Router();

router.post('/send/message', async (req, res, next) => {
    try {
        const userId = req.userId;
        const content = req.body.content;
        const conversationId = req.body.conversationId;
        const slug = req.body.slug;
        const response = await sendMessage(userId, content, conversationId, slug);
        eventEmitter.emit('message.send', response);
        res.json({message:response.message});
    } catch(err) {
        next(err);
    }
});

router.post('/send/file', upload.array('file'), async (req, res, next) => {
    try {
        const userId = req.userId;
        const files = req.files;
        const conversationId = Number((JSON.parse(req.body.data)).conversationId);
        const response = await sendFile(userId, files, conversationId);
        eventEmitter.emit('file.send', response);
        res.json(response);
    } catch(err) {
        next(err);
    }
})

router.get('/download/:filename', async (req, res, next) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'files', filename);
    res.download(filePath)
})

router.get('/conversations', async (req, res, next) => {
    const userId = req.userId;
    const response = await getAllConversations(userId);
    res.json(response);
})

router.get('/media', async (req, res, next) => {
    const userId = req.userId;
    const conversationId = Number(req.query.conversationId);
    const fileName = req.query.fileName;
    const offset = Number(req.query.offset);
    console.log(req.query.offset)
    const response = await getMediaInConversation(userId, conversationId, fileName, offset);
    res.json(response);
})

router.get('/docs/:conversationId', async (req, res, next) => {
    const userId = req.userId;
    const conversationId = Number(req.params.conversationId);
    const response = await getDocsInConversation(userId, conversationId);
    res.json(response);
})

router.get('/files', async (req, res, next) => {
    const userId = req.userId;
    const conversationId = Number(req.query.conversationId);
    const filename = req.query.filename;
    const response = await getFilesInConversation(userId, conversationId, filename);
    res.json(response);
});

router.post('/friendship', async (req, res, next) => {
    const fromId = req.userId;
    const toId = Number(req.body.toId);
    const response = await manageFriendShip(fromId, toId);
    console.log(response);
    res.json(response);
})

router.post('/status-friendship', async (req, res, next) => {
    const fromId = req.userId;
    const toId = Number(req.body.userId);
    
    const status = Number(req.body.status);
    const response = await statusFriendShip(fromId, toId, status);
    res.json(response);
})

router.get('/blocked-users', async (req, res, next) => {
    const userId = req.userId;
    const response = await getBlockedUsers(userId);
    res.json(response);
})

router.get('/contact-users', async (req, res, next) => {
    const userId = req.userId;
    const response = await getContactUsers(userId);
    res.json(response);
})

router.get('/send-requests', async (req, res, next) => {
    const userId = req.userId;
    console.log(userId);
    const response = await getSendRequests(userId);
    res.json(response);
})

router.get('/receive-requests', async (req, res, next) => {
    const userId = req.userId;
    console.log(userId)
    const response = await getReceiveRequests(userId);
    res.json(response);
})

router.get('/init/:conversationId', async (req, res, next) => {
    const userId = req.userId;
    const conversationId = Number(req.params.conversationId);
    //const response = await getMessagesByUser(userId);
    const response = await getMessagesByConversation(userId, conversationId);
    res.json(response);
});

router.get('/communication/:id', async (req, res, next) => {
    const senderId = req.userId;
    const receiverId = Number(req.params.id);
    console.log(senderId);
    console.log(receiverId);
    console.log('ae')
    const response = await getMessagesFromCommunication(senderId, receiverId);
    res.json(response);
})

router.get('/messages/:id', async (req, res, next) => {
    const userId = req.userId;
    const conversationId = Number(req.params.id);
    const response = await getMessagesFromConversation(userId, conversationId);
    res.json(response);
});

router.get('/more/messages', async (req, res, next) => {
    const userId = req.userId;
    const offset = Number(req.query.offset);
    const conversationId = Number(req.query.conversationId);
    const response = await getMoreMessages(userId, conversationId, offset);
    res.json(response);
});

router.post('/seen', async (req, res, next) => {
    const userId = req.userId;
    const conversationId = Number(req.body.conversationId);
    const response = await addSeenToConversation(userId, conversationId);
    res.json(response);
});

router.get('/unseen/messages', async (req, res, next) => {
    const userId = req.userId;
    console.log(req.userId)
    const response = await checkUnseenMessages(userId);
    res.json(response);
});

router.get('/all/conversations', async (req, res, next) => {
    const userId = 1;
    const response = await getAllConversations(userId);
    res.json(response);
});

router.post('/add/user', async (req, res, next) => {
    const adminId = 1;
    const userId = Number(req.body.JSONuserId);
    const conversationId = Number(req.body.conversationId);
    const response = await addUserToConversation(adminId, userId, conversationId);
    res.json(response);
    eventEmitter.emit('user.added', response);
});

router.post('/remove/user', async (req, res, next) => {
    const adminId = 1;
    const userId = Number(req.body.userId);
    const conversationId = Number(req.body.conversationId);
    const response = await removeUserFromConversation(adminId, userId, conversationId);
    res.json(response);
    eventEmitter.emit('user.removed', response);
});

router.get('/users', async (req, res, next) => {
    const userId = Number(req.userId);
    const response = await getAllUsers(userId);
    res.json(response);
})

router.post('/create/group', async (req, res, next) => {
    const fromId = req.userId;
    const userIds = req.body.userIds;
    const adminId = req.body.adminId;
    const groupName = req.body.groupName;
    const response = await createGroup(fromId, userIds, adminId, groupName);
    res.json(response);
})

router.get('/users/:id', async (req, res, next) => {
    const userId = req.userId;
    const conversationId = Number(req.params.id);
    const response = await getAllUsersInConversation(userId, conversationId);
    res.json(response);
})

router.get('/admin/conversations', async (req, res, next) => {
    const adminId = req.userId;
    const response = await getAllConversationsWhereAdmin(adminId);
    res.json(response);
})

router.post('/create/conversation', async (req, res, next) => {
    const adminId = 3;
    const userId = Number(req.body.userId);
    const response = await createConversation(userId);
    res.json(response);
});

router.post('/update/conversation', async (req, res, next) => {
    const adminId = 3;
    const userId = Number(req.body.userId);
    const conversationId = Number(req.body.conversationId);
    const response = await updateConversation(userId, conversationId);
    res.json(response);
});

export default router;