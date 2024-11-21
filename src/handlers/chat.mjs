import { pool } from "../database/connect.mjs";
import { Conversation } from "../models/conversation.model.mjs";
import { File } from "../models/file.model.mjs";
import { Message } from "../models/message.model.mjs";
import { UserConversation } from "../models/userConversation.model.mjs";
import { getOne, insertRow, insertRows, throwError, updateRow, updateAndSelect, getMany, deleteRow } from "../utils/index.mjs";
import gatewaySessionManager from "../gateway/sessions.mjs";
import path from 'path';
import { FriendShips } from "../models/friendships.model.mjs";


export const getAllConversationsWhereAdmin = async (userId) => {
    const conversations = await getMany(`select c.id, c.name, u.id as adminId, concat(u.firstName, ' ', u.lastName) as adminName
                                         from conversation as c 
                                         left join user as u on u.id = c.adminId
                                         where c.adminId = ?;`, [userId]);
    for (const conversation of conversations) {
        conversation.users = await getMany(`select u.id, concat(u.firstName, ' ', u.lastName) as name from user as u left join user_conversation as uc on u.id = uc.userId where uc.conversationId = ?`, [conversation.id]);

    }
    console.log(conversations)
    return conversations;
}

export const getAllUsers = async (userId) => {
    const conversation = await getOne('select * from conversation where adminId = ?', [userId]);
    if (!conversation) throwError('მომხმარებელი არაა ადმინი', 400);
    console.log(conversation)
    const conversationId = conversation.id;
    const sql = `select u.id, concat(u.firstName, ' ', u.lastName) as name, u.role from user as u
                 left join user_conversation as uc on u.id = uc.userId
                 left join conversation as c on c.id = uc.conversationId

                 where uc.conversationId = ?;`;
    const users = await getMany(sql, [conversationId]);
    return users;
}

export const createGroup = async (fromId, userIds, adminId, groupName) => {
    //const conversation = await usersInConversation(fromId, userIds, adminId);
    //if(!conversation) thro
    const conversation = new Conversation(groupName, 0, 0, null, adminId);
    const [resultSet] = await insertRow('conversation', conversation);
    const conversationId = resultSet.insertId;
    for (const userId of userIds) {
        const userConversation = new UserConversation(userId, conversationId);
        await insertRow('user_conversation', userConversation);
    }
    return { message: 'ჩათი წარმატებით დაემატა' };
}

export const sendMessage = async (userId, content, conversationId, slug) => {
    const conversation = await userInconversationExists(userId, conversationId);
    if (!conversation) throwError({ message: 'მომხმარებელი ამ ჩათში არ მოიძებნა', slug }, 400);
    const message = await createMessage(content, conversationId, userId, slug);
    if (!message) throwError('მესიჯი ვერ გაიგზავნა', 400);
    const prevMessages = await getMany('select * from message order by created desc limit 2');
    message.time = getFormatedTime(message.created);
    message.sent = true;
    message.last = true;
    message.first = isFirstMessage(message, prevMessages);
    conversation.lastMessageId = message.id;
    updateAndSelect('conversation', conversation, { id: conversation.id });
    seenStateOnSendMessage(userId, conversationId);
    return { message: message, conversation: conversation };
}

export const sendFile = async (userId, files, conversationId) => {
    const message = new Message('', conversationId, userId, 1);
    const [insertResult] = await insertRow('message', message);
    const messageId = insertResult.insertId;
    await addFiles(files, messageId);
    const getMessage = await getFileMessage(messageId);
    return { message: getMessage, conversationId: conversationId };
}

export const getFilesInConversation = async (userId, conversationId, filename) => {
    const conversation = await userInconversationExists(userId, conversationId);
    if (!conversation) throwError('მომხმარებელი ამ ჩათში არ მოიძებნა', 400);
    const sql = `
      select m.id, f.path, f.extension, f.size, f.mime
      from message as m 
      inner join files as f on m.id = f.messageId
      order by f.created desc
      ;
    `;
    const messages = await getMany(sql);
    messages.forEach(message => {
        if (message.mime) {
            message.mime = message.mime.split('/')[0]
        }
    })
    let sortedMessages;
    if (filename !== '') {
        sortedMessages = sortMessagesByPath(messages, filename);
    } else {
        sortedMessages = messages;
    }
    return sortedMessages;
}

export const getMediaInConversation = async (userId, conversationId, fileName='', offset) => {
    const limit = offset * 30;
    const conversation = await userInconversationExists(userId, conversationId);
    if (!conversation) throwError('მომხმარებელი ამ ჩათში არ მოიძებნა', 400);
    const sql = `select m.id, f.path, f.extension, f.size, f.mime, f.fileName
                 from message as m 
                 inner join files as f on m.id = f.messageId
                 where f.mime like 'image/%' or f.mime like 'video/%'
                 order by f.created desc
                 limit ?;
                 `
    const messages = await getMany(sql, [limit]);
    console.log(messages)
    let sortedMessages;
    if (fileName !== '') {
        sortedMessages = sortMessagesByPath(messages, fileName);
    } else {
        sortedMessages = messages;
    }
    return sortedMessages;
}

export const getDocsInConversation = async (userId, conversationId) => {
    const conversation = await userInconversationExists(userId, conversationId);
    if (!conversation) throwError('მომხმარებელი ამ ჩათში არ მოიძებნა', 400);
    const sql = `select m.id, f.path, f.extension, f.size, f.mime, f.id as file_id, f.fileName
                 from message as m 
                 inner join files as f on m.id = f.messageId
                 where not (f.mime like 'image/%' or f.mime like 'video/%')
                 order by f.created desc`;
    const messages = await getMany(sql);
    return messages;
}

export const getAllUsersInConversation = async (userId, conversationId) => {
    const conversation = await userInconversationExists(userId, conversationId);
    if (!conversation) throwError('მომხმარებელი ამ ჩათში არ მოიძებნა', 400);
    const blockedUsers = await getBlockedUsers(userId);
    const blockedIds = blockedUsers.map(user => user.id);
    const blockedByUsers = await getBlockedByUsers(userId);
    const blockedByIds = blockedByUsers.map(user => user.id);
    const uniqueArray = mergeUniqueArrays(blockedByIds, blockedIds);
    const uniquePlaceholders = uniqueArray.join(', ');

    const sql = `select u.id, u.firstName, u.lastName, u.role from user as u
                 left join user_conversation as uc on u.id = uc.userId
                 left join friendships as f on f.fromId = u.id   
                 where ${uniqueArray.length > 0 ? `u.id not in (${uniquePlaceholders}) and` : ''} u.id <> ? and uc.conversationId = ?
                 `;
    const users = await getMany(sql, [userId, conversationId]);
    return users;
}

export const getMessagesFromCommunication = async (senderId, receiverId) => {
    const {messagesArr, conversationId} = await getCoupleConversation(senderId, receiverId);
    console.log(messagesArr);
    console.log(conversationId);
    console.log('ae')
    if(!messagesArr) return emptyMessagesWithDefaultDate(conversationId);
    const sql = `select m.id, m.content, m.created, m.userId, m.conversationId, m.type, u.firstName, u.lastName, 
       CONCAT(
        '[',
        GROUP_CONCAT(
             CONCAT(
                '{"path": "', f.path, '", ',
                '"extension": "', f.extension, '", ',
                '"size": ', f.size, ', ', 
                '"mime": "', f.mime, '", ',
                '"name":"', f.fileName, '"}'
              )
            ),
        ']'
    ) AS files
                 from message as m 
                 left join conversation as c on m.conversationId = c.id
                 left join user as u on m.userId = u.id
                 left join files as f on m.id = f.messageId
                 where m.conversationId = ?
                 group by m.id
                 order by m.created desc
                 limit 30;
                 `;
    const messages = await getMany(sql, [conversationId]);
    messages.forEach(message => {
        if (message.hasOwnProperty('files')) {
            message.files = JSON.parse(message.files);
        }
    });
    const online = getStatusByConversationId(conversationId);
    return { conversationId, messages, online };

}

export const getMessagesByConversation = async (userId, conversationId) => {
    const messages = await getMessagesFromConversation(userId, conversationId);
    const online = getStatusByConversationId(conversationId);
    return { conversationId, messages, online };
}

export const getMessagesFromConversation = async (userId, conversationId) => {
    const conversation = await userInconversationExists(userId, conversationId);
    if (!conversation) throwError('მომხმარებელი ამ ჩათში არ მოიძებნა', 400);
    const sql = `select m.id, m.content, m.created, m.userId, m.conversationId, m.type, u.firstName, u.lastName, 
       CONCAT(
        '[',
       GROUP_CONCAT(
             CONCAT(
                '{"path": "', f.path, '", ',
                '"extension": "', f.extension, '", ',
                '"size": ', f.size, ', ', 
                '"mime": "', f.mime, '", ',
                '"name":"', f.fileName, '"}'
              )
            ),
        ']'
    ) AS files
                 from message as m 
                 left join conversation as c on m.conversationId = c.id
                 left join user as u on m.userId = u.id
                 left join files as f on m.id = f.messageId
                 where m.conversationId = ?
                 group by m.id
                 order by m.created desc
                 limit 30;
                 `;
    const messages = await getMany(sql, [conversationId]);
    messages.forEach(message => {
        if (message.hasOwnProperty('files')) {
            message.files = JSON.parse(message.files);
        }
    })

    const messagesByDate = generateMessages(messages, userId);
    return messagesByDate;

}

export const addSeenToConversation = async (userId, conversationId) => {
    const conversation = await userInconversationExists(userId, conversationId);
    if (!conversation) throwError('მომხმარებელი ამ ჩათში არ მოიძებნა', 400);
    await tryAddSeen(userId, conversationId);
    return { message: 'მესიჯი დასინულია' };
}

export const checkUnseenMessages = async (userId) => {
    const conversation = await getOne('select * from user_conversation where userId = ?', [userId]);
    if (!conversation) throwError('მომხმარებელი ჩათში არ მოიძებნა', 400);
    return conversation.seen;
}

export const getMoreMessages = async (userId, conversationId, offset) => {
    const offsetNumber = offset === 1 ? 30 : offset * 30;
    const conversation = await userInconversationExists(userId, conversationId);
    if (!conversation) throwError('მომხმარებელი მსგავს ჩათში არ მოიძენბა', 400);
    const sql = `select m.id, m.content, m.created, m.userId, m.conversationId, m.type, u.firstName, u.lastName, 
       CONCAT(
        '[',
        GROUP_CONCAT(
             CONCAT(
                '{"path": "', f.path, '", ',
                '"extension": "', f.extension, '", ',
                '"size": ', f.size, ', ', 
                '"mime": "', f.mime, '", ',
                '"name":"', f.fileName, '"}'
              )
            ),
        ']'
    ) AS files
                 from message as m 
                 left join conversation as c on m.conversationId = c.id
                 left join user as u on m.userId = u.id
                 left join files as f on m.id = f.messageId
                 where m.conversationId = ?
                 group by m.id
                 order by m.created desc
                 limit ?;
                 `;
    const messages = await getMany(sql, [conversationId, offsetNumber]);
    messages.forEach(message => {
        if (message.hasOwnProperty('files')) {
            message.files = JSON.parse(message.files);
        }
    })

    //const messages = await getMany(sql, [conversationId, offsetNumber]);
    const messagesByDate = generateMessages(messages, userId);
    return messagesByDate;
}

export const getMessagesByUser = async (userId) => {
    const conversationId = await baseConversationIdByUser(userId);
    const messages = await getMessagesFromConversation(userId, conversationId);
    const online = getStatusByConversationId(conversationId);
    return { conversationId, messages, online };
}

export const addUserToConversation = async (adminId, userId, conversationId) => {
    const exist = await userInconversationExists(userId, conversationId);
    if (exist) throwError('მომხმარებელი ამ ჩათში უკვე არსებობს', 400);
    const conversation = await isUserConversationAdmin(adminId, conversationId);
    if (!conversation) throwError('მომხმარებლის დამატება მხოლოდ ადმინს შეუძლია', 400);
    const userConversation = new UserConversation(userId, conversationId);
    await insertRow('user_conversation', userConversation);
    return { message: 'მომხამრებელი წარმატებით დაემატა ჩათში' };
}

export const removeUserFromConversation = async (adminId, userId, conversationId) => {
    const exist = await userInconversationExists(userId, conversationId);
    if (!exist) throwError('მომხმარებელი ამ ჩათში არ არსებობს', 400);
    const conversation = await isUserConversationAdmin(adminId, conversationId);
    if (!conversation) throwError('მომხმარებლის წაშლა მხოლოდ ადმინს შეუძლია', 400);
    const userConversation = await getOne('select * from user_conversation where conversationId = ? and userId = ?', [conversationId, userId]);
    await deleteRow('user_conversation', { id: userConversation.id });
    return { message: 'მომხამრებელი წარმატებით წაიშალა ჩათიდან' };
}

export const createConversation = async (userId) => {
    const conversation = new Conversation(null, userId);
    await insertRow('conversation', conversation);
    return { message: 'ჩათის ადმინი წარმატებით დაემატა' };
}

export const updateConversation = async (userId, conversationId) => {
    const conversation = await userInconversationExists(userId, conversationId);
    if (!conversation) throwError('მომხმარებელი არაა ჩათში და ადმინი ვერ გახდება', 400);
    conversation.adminId = userId;
    await updateRow('conversation', conversation, { id: conversation.id });
    return { message: 'ჩათის ადმინი წარმატებით შეიცვალა' };
}
/*
export const getAllConversations = async (userId) => {
    return await getMany(`select c.* from conversation as c
                          left join user_conversation as uc on uc.conversationId = c.id
                          where uc.userId = ?`, [userId]);

}
*/

export const manageFriendShip = async (fromId, toId) => {
    return await friendShipStatus(fromId, toId);
}

export const statusFriendShip = async (fromId, toId, status) => {
    const friendship = await userInFriendship(fromId, toId);
    if (!friendship && status !== 3) throwError('მომხმარებელი ამ ჩათში არ მოიძებნა', 403);
    if (status === 0) {
        //await deleteRow('friendships', { id: friendship.id });
        if (friendship.status === 1) {
            console.log('aeee');
            console.log(friendship)
            if (friendship.fromId === fromId) {
                const fromid = friendship.toId;
                const toid = fromId;
                const friendships = await getFriendship(fromid, toid);
                if (friendships) {
                    await deleteRow('friendships', { id: friendships.id });
                }
            } else {
                const fromid = fromId;
                const toid = friendship.fromId;
                const friendships = await getFriendship(fromid, toid);
                if (friendships) {
                    await deleteRow('friendships', { id: friendships.id });
                }
            }
            return { status: 'success', message: 'მომხმარებელი წარმატებით წაიშალა მეგობრებიდან' };
        } else if (friendship.status === 2) {
            await deleteRow('friendships', { id: friendship.id });
            return { status: 'success', message: 'მეგობრობის მოთხოვნა წარმატებით წაიშალა' };
        } else {
            await deleteRow('friendships', { id: friendship.id });
            return { status: 'success', message: 'მომხმარებელს წარმატებით მოეხსნა ბლოკი' };
        }
    } else if (status === 1) {
        friendship.status = status;
        await updateRow('friendships', friendship, { id: friendship.id });
        if (friendship.fromId === fromId) {
            const fromid = friendship.toId;
            const toid = fromId;
            const friendships = new FriendShips(fromid, toid, 1);
            await insertRow('friendships', friendships);
            await insertConversation(fromId, toId);

        } else {
            const fromid = fromId;
            const toid = friendship.fromId;
            const friendships = new FriendShips(fromid, toid, 1);
            await insertRow('friendships', friendships);
            await insertConversation(fromId, toId);
        }
        return { status: 'success', message: 'მომხმარებელი წარმატებით დაემატა კონტაქტებში' };
    } else {
        if (friendship) {
            friendship.status = status;
            await updateRow('friendships', friendship, { id: friendship.id });
            if (friendship.fromId === fromId) {
                const fromid = friendship.toId;
                const toid = fromId;
                const friendships = await getFriendship(fromid, toid);
                if (friendships) {
                    await deleteRow('friendships', { id: friendships.id });
                }
            } else {
                const fromid = friendship.toId;
                const toid = fromId;
                const friendships = await getFriendship(fromid, toid);
                if (friendships) {
                    await deleteRow('friendships', { id: friendships.id });
                }
            }
        } else {
            const friendships = new FriendShips(fromId, toId, 3);
            await insertRow('friendships', friendships);
        }
        return { status: 'success', message: 'მომხმარებელი წარმატებით დაიბლოკა' };
    }

}

export const statusBlock = async (fromId, toId, status) => {
    const friendship = await isUserInFriendship(userId)
}

export const getSendRequests = async (userId) => {
    const sql = `SELECT f.id AS requestId, f.toId as userId,  concat(u.firstName, ' ', u.lastName) AS name, f.status, f.updated
                 FROM friendships f
                JOIN user u ON f.toId = u.id
                WHERE f.fromId = ? and f.status = 2;`;
    const requests = await getMany(sql, [userId]);
    requests.forEach(request => {
        request.date = getFormatedDate(request.updated);
        request.time = getFormatedTime(request.updated);
    })
    return requests;
}

export const getReceiveRequests = async (userId) => {
    const sql = `SELECT f.id AS requestId, f.fromId AS userId, CONCAT(u.firstName, ' ', u.lastName) AS name, f.status, f.updated
                 FROM friendships f
                JOIN user u ON f.fromId = u.id
                WHERE f.toId = ? AND f.status = 2;`
    const requests = await getMany(sql, [userId]);
    requests.forEach(request => {
        request.date = getFormatedDate(request.updated);
        request.time = getFormatedTime(request.updated);
    })
    return requests;
}

export const getBlockedUsers = async (userId) => {
    const sql = `SELECT f.toId as id,  concat(u.firstName, ' ', u.lastName) AS name, f.status, f.updated
                 FROM friendships f
                 JOIN user u ON f.toId = u.id
                 WHERE f.fromId = ? and f.status = 3;`;
    const users = await getMany(sql, [userId]);
    users.forEach(user => {
        user.date = getFormatedDate(user.updated);
        user.time = getFormatedTime(user.updated);
    })
    return users;
}

export const getContactUsers = async (userId) => {
    const sql = ` SELECT DISTINCT u.id, CONCAT(u.firstName, ' ', u.lastName) AS name, f.status, f.updated
                                     FROM friendships f
                                     JOIN user u ON f.fromId = u.id
                                     WHERE (f.fromId = ? OR f.toId = ?)
                                     AND f.status = 1
                                     AND u.id != ?;
`;
    const users = await getMany(sql, [userId, userId, userId]);
    users.forEach(user => {
        user.date = getFormatedDate(user.updated);
        user.time = getFormatedTime(user.updated);
    })
    return users;
}

export const getAllConversations = async (userId) => {
    const conversationsSQL = `select c.id as conversationId, c.couple, c.name, uc.seen, i.path  from conversation as c
                              left join user_conversation as uc on c.id = uc.conversationId
                              left join images as i on c.id = i.conversationId
                              where uc.userId = ? and c.couple = 0;
                             `;
    const conversations = await getMany(conversationsSQL, [userId]);
    /*
    const coupleConversationsSQL = `select u.id as userId, concat(u.firstName, ' ', u.lastName) as name from user as u
                                 left join user_conversation as uc on u.id = uc.userId
                                 left join conversation as c on c.id = uc.conversationId
                                 where c.couple = 1 and u.id <> ?;`;
    const coupleConversations = await getMany(coupleConversationsSQL, [userId]);
    */
    const coupleConversationsSQL = ` SELECT DISTINCT u.id, CONCAT(u.firstName, ' ', u.lastName) AS name
                                     FROM friendships f
                                     JOIN user u ON (f.fromId = u.id OR f.toId = u.id)
                                     WHERE (f.fromId = ? OR f.toId = ?)
                                     AND f.status = 1
                                     AND u.id != ?;
    `;
    const coupleConversations = await getMany(coupleConversationsSQL, [userId, userId, userId]);
    const coupleIds = coupleConversations.map(user => user.id);
    coupleIds.push(userId);
    const blockedByUsers = await getBlockedByUsers(userId);
    const blockedByIds = blockedByUsers.map(user => user.id);
    const blockedUsers = await getBlockedUsers(userId);
    const blockedIds = blockedUsers.map(user => user.id);
    const uniqueArray = mergeUniqueArrays(coupleIds, blockedByIds, blockedIds);
    const couplePlaceholders = uniqueArray.map(() => '?').join(', ');
    const uncoupledConversationsSQL = ` select u.id as userId, concat(u.firstName, ' ', u.lastName) as name from user as u
                                        where u.id not in (${couplePlaceholders});`
    const uncoupledConversations = await getMany(uncoupledConversationsSQL, uniqueArray);

    const fullConversations = generateConversations(conversations, coupleConversations, uncoupledConversations);
    return fullConversations;
}

const usersInConversation = async (fromId, userIds, adminId) => {

}

const mergeUniqueArrays = (...arrays) => {
    const uniqueSet = new Set();
    arrays.forEach(arr => {
        arr.forEach(item => {
            uniqueSet.add(item);
        });
    });

    const uniqueArray = Array.from(uniqueSet);
    return uniqueArray;
}

const getBlockedByUsers = async (userId) => {
    const sql = `SELECT f.fromId as id,  concat(u.firstName, ' ', u.lastName) AS name, f.status, f.updated
                 FROM friendships f
                 JOIN user u ON f.toId = u.id
                 WHERE f.toId = ? and f.status = 3;`;
    const users = await getMany(sql, [userId]);
    return users;
}

const insertConversation = async (fromId, toId) => {
    const exist = usersInCoversation(fromId, toId);
    if (!exist) {
        const conversation = new Conversation('', 1);
        const [resultSet] = await insertRow('conversation', conversation);
        const conversationId = resultSet.insertId;
        const userConversation1 = new UserConversation(fromId, conversationId);
        const userConversation2 = new UserConversation(toId, conversationId);
        await insertRow('user_conversation', userConversation1);
        await insertRow('user_conversation', userConversation2);
    }
}

const getFriendship = async (fromId, toId) => {
    const sql = `select * from friendships where fromId = ? and toId = ?`;
    const friendship = await getOne(sql, [fromId, toId]);
    return friendship;
}

const userInFriendship = async (fromId, toId) => {
    const sql = `select * from friendships where (fromId = ? and toId = ?) or (fromId = ? and toId = ?)`;
    const friendship = await getOne(sql, [fromId, toId, toId, fromId]);
    return friendship;
}

const isUserInFriendship = async (userId, friendshipId) => {
    const sql = `select * from friendships where (fromId = ? or toId = ?) and id = ?;`;
    return await getOne(sql, [userId, userId, friendshipId]);

}

const friendShipStatus = async (fromId, toId) => {
    const sendFriendship = await getOne(`select * from friendships where fromId = ? and toId = ?`, [fromId, toId]);
    if (sendFriendship && sendFriendship.status === 1) return { status: 'success', message: '' };
    if (sendFriendship && sendFriendship.status === 2) return { status: 'pending', message: 'გთხოვთ დაელოდოთ, მომხმარებელს ჯერ თქვენი მოთხოვნა არ დაუდასტურებია' };
    if (sendFriendship && sendFriendship.status === 3) return { status: 'block', message: 'მომხმარებელი თქვენს მიერ დაბლოკილია' };
    const receiveFriendShip = await getOne(`select * from friendships where fromId = ? and toId = ?`, [toId, fromId]);
    if (receiveFriendShip && receiveFriendShip.status === 2) {
        const friendship = new FriendShips(fromId, toId, 1);
        receiveFriendShip.status = 1;
        await updateRow('friendships', receiveFriendShip, { id: receiveFriendShip.id });
        await insertRow('friendships', friendship);
        await manageCoupleConversation(fromId, toId);
        return { status: 'success', message: '' };
    }
    if (receiveFriendShip && receiveFriendShip.status !== 3) {
        const friendship = new FriendShips(fromId, toId, 2);
        await insertRow('friendships', friendship);
        return { status: 'init', message: 'თქვენ წარმატებით გაუგზავნეთ მომხმარებელს მოთხოვნა, გთხოვთ დაელოდოთ პასუხს' };
    }

    if (!receiveFriendShip || !sendFriendship) {
        const friendship = new FriendShips(fromId, toId, 2);
        await insertRow('friendships', friendship);
        return { status: 'init', message: 'თქვენ წარმატებით გაუგზავნეთ მომხმარებელს მოთხოვნა, გთხოვთ დაელოდოთ პასუხს' };
    }
}

const manageCoupleConversation = async (fromId, toId) => {
    const conversation = await coupleConversation(fromId, toId);
    if (!conversation) await addCoupleConversation(fromId, toId);
}

const addCoupleConversation = async (fromId, toId) => {
    const conversation = new Conversation('', 1, 0);
    const [resultSet] = await insertRow('conversation', conversation);
    const conversationId = resultSet.insertId;
    const userConversation1 = new UserConversation(fromId, conversationId, 0);
    const userConversation2 = new UserConversation(toId, conversationId, 0);
    await insertRow('user_conversation', userConversation1);
    await insertRow('user_conversation', userConversation2);
}

const generateConversations = (conversations, coupleConversations, uncoupledConversations) => {
    const fullConversations = [
        {
            name: 'ჩათები',
            conversations: conversations
        },
        {
            name: 'კონტაქტები',
            conversations: coupleConversations
        },
        {
            name: 'ორგანიზაციის წევრები',
            conversations: uncoupledConversations
        }
    ];
    return fullConversations;
}

const emptyMessagesWithDefaultDate = (conversationId) => {
    let messages = [{
        date:'დღეს',
        messages:[]
    }];
    const online = getStatusByConversationId(conversationId);
    return {messages, conversationId, online}
}

const getCoupleConversation = async (senderId, receiverId) => {
    const conversation = await getOne(`SELECT c.id AS conversation_id, u.id AS user_id, u.firstName AS firstName
                                       FROM conversation c
                                       JOIN user_conversation uc1 ON c.id = uc1.conversationId
                                       JOIN user_conversation uc2 ON uc1.conversationId = uc2.conversationId
                                       JOIN user u ON uc2.userId = u.id
                                       WHERE uc1.userId = ? AND uc2.userId = ?
                                       and c.couple = ?;`, [senderId, receiverId, 1]);
                                       console.log(conversation)
    if (!conversation) throwError('მომხმარებლებს ჩათი არ აქვთ', 400);
    console.log(conversation);
    const conversationId = conversation.id;
    const messages = await getMany('select * from message where conversationId = ?', [conversationId]);
    return {messages, conversationId};
}

const coupleConversation = async (fromId, toId) => {
    const conversation = await getOne(`select distinct c.* from conversation as c
        left join user_conversation as uc on uc.conversationId = c.id
        where (uc.userId = ? or uc.userId = ?) and c.couple = ?;`, [fromId, toId, 1]);
    if (!conversation) return null;
}

const usersInCoversation = async (fromId, toId) => {
    const sql = `SELECT c.id AS conversationId, c.adminId, c.couple
                 FROM conversation c
                 JOIN user_conversation uc1 ON c.id = uc1.conversationId AND uc1.userId = ?
                 JOIN user_conversation uc2 ON c.id = uc2.conversationId AND uc2.userId = ?
                 WHERE c.couple = 1;`
    const converastion = await getOne(sql, [fromId, toId]);
    return converastion;
}

const usersInCommunication = async (fromId, toId) => {
    return await getOne(`select id from communication where (senderId = ? and receiverId = ?) or (senderId = ? and receiverId = ?)`, [fromId, toId, toId, fromId]);
}

const getFileMessage = async (messageId) => {
    const [message] = (await pool.query(`
        select m.id, m.content, m.created, m.userId, m.conversationId, m.type, u.firstName, u.lastName,
        CONCAT(
          '[',
           GROUP_CONCAT(
             CONCAT(
                '{"path": "', f.path, '", ',
                '"extension": "', f.extension, '", ',
                '"size": ', f.size, ', ', 
                '"mime": "', f.mime, '", ',
                '"name":"', f.fileName, '"}'
              )
            ),
         ']'
         ) AS files
        from message as m
        inner join files as f on m.id = f.messageId
        left join user as u on u.id = m.userId
        where m.id = ?
        group by m.id;
      `, [messageId]))[0];
    message.files = JSON.parse(message.files);
    message.files.forEach(file => {
        file.size = Math.ceil(file.size / 1024);
    })
    return message;
}

const sortMessagesByPath = (messages, filename) => {
    return messages.sort((a, b) => {
        if (a.path === filename) return -1;
        if (b.path === filename) return 1;
        return 0;
    })
}

const addFiles = async (files, messageId) => {
    for (const file of files) {
        const { path, size, filename, mimetype, originalname } = file;
        const extension = getFileExtension(path);
        const uFile = new File(filename, messageId, extension, size, mimetype, originalname);
        await insertRow('files', uFile);
    }
}

const getFileExtension = (filePath) => {
    return path.extname(filePath).substring(1);
}

const getStatusByConversationId = (conversationId) => {
    const conversationName = `conv-${conversationId}`;
    const sockets = gatewaySessionManager.getRoom(conversationName);
    if (sockets.size === 1 || sockets.size === 0) return false;
    else return true;

}

const isFirstMessage = (message, prevMessages) => {
    if (prevMessages.length > 1) {
        let prevMessage = prevMessages[1];
        if (message.userId !== prevMessage.userId && message.sent === false) {
            return true;
        } else {
            return false;
        }
    } else {
        return true;
    }
}

const baseConversationIdByUser = async (userId) => {
    const conversation = await getOne('select * from user_conversation where userId = ?', [userId]);
    if (!conversation) throwError('მომხმარებელი ჩათში ვერ მოიძებნა', 400);
    return conversation.conversationId;
}

const seenStateOnSendMessage = async (userId, conversationId) => {
    const userConversations = await getMany('select * from user_conversation where conversationId = ?', [conversationId]);
    userConversations.forEach(userConversation => {
        if (userId === userConversation.userId) {
            userConversation.seen = 1;
        } else {
            userConversation.seen = 0;
        }
        updateRow('user_conversation', userConversation, { id: userConversation.id });
    });
}

const isUserConversationAdmin = async (adminId, conversationId) => {
    const conversation = await getOne('select * from conversation where id = ? and adminId = ?', [conversationId, adminId]);
    return conversation;
}

const tryAddSeen = async (userId, conversationId) => {
    const userConversation = await getOne('select * from user_conversation where conversationId = ? and userId = ?', [conversationId, userId]);
    userConversation.seen = 1;
    await updateRow('user_conversation', userConversation, { id: userConversation.id });
}

const getUserByMessageId = async (id) => {
    if (id === null) {
        return null;
    } else {
        const message = await getOne('select * from message where id = ?', [id]);
        return message.userId;
    }
}

const generateMessages = (messages, userId) => {
    const reversed = messages.reverse();
    const messagesByDate = {};
    if (messages.length === 0) {
        const messageObject = {
            date: 'დღეს',
            messages: []
        };
        return [messageObject];
    } else {
        reversed.forEach((message, index) => {
            let date;
            const messageDate = message.created;
            const dateUtc = new Date();
            const now = new Date(dateUtc.getTime() - dateUtc.getTimezoneOffset() * 60 * 1000);
            const yesterdayMin = getRangeMin(now);
            const yesterdayMax = getRangeMax(now);
            const lastWeek = getRangeWeek(now);
            date = getMessageDate(messageDate, yesterdayMin, yesterdayMax, lastWeek);

            message = isMessageSent(message, userId);
            message = isMessageLast(message, reversed, index);
            message = isMessageFirst(message, reversed, index);
            message.time = getFormatedTime(messageDate);
            if (!messagesByDate[date]) {
                messagesByDate[date] = [];
                message.first = true;
            }
            messagesByDate[date].push(message);
        })
    }
    const result = [];
    for (const date of Object.keys(messagesByDate)) {
        result.push({ date, messages: messagesByDate[date] });
    }
    return result;
}

const isMessageSent = (message, userId) => {
    if (message.userId === userId) {
        message.sent = true;
    } else {
        message.sent = false;
    }
    return message;
}

const isMessageLast = (message, reversed, index) => {
    if (message.userId !== reversed[index + 1]?.userId) {
        message.last = true;
    } else {
        message.last = false;
    }
    return message;
}

const isMessageFirst = (message, reversed, index) => {

    if (message.userId !== reversed[index - 1]?.userId && message.sent === false) {
        message.first = true;
    } else {
        message.first = false;
    }
    return message;
}

const getMessageDate = (messageDate, yesterDayMin, yesterdayMax, lastWeek) => {
    let date;
    if (messageDate >= lastWeek && messageDate < yesterDayMin) {
        const dateString = messageDate.toISOString().substring(0, 10);
        const dateObj = new Date(dateString);
        date = getDayName(dateObj.getDay())
    } else if (messageDate >= yesterDayMin && messageDate < yesterdayMax) {
        date = 'გუშინ'
    } else if (messageDate >= yesterdayMax) {
        date = 'დღეს'
    } else {
        date = getFormatedDateWithYear(messageDate);
    }

    return date;
}

const getDayName = (dayIndex) => {
    const days = ['კვირა', 'ორშაბათი', 'სამშაბათი', 'ოთხშაბათი', 'ხუთშაბათი', 'პარასკევი', 'შაბათი'];
    return days[dayIndex];
}

const getFormatedDateWithYear = (date) => {
    const components = date.toISOString().substring(0, 10).split("-");
    return components[2] + "." + components[1] + "." + components[0]
}

const getFormatedDate = (date) => {
    const components = date.toISOString().substring(0, 10).split("-");
    return components[2] + "." + components[1] + "." + components[0]
}

const getFormatedTime = (date) => {
    return date.toISOString().substring(11, 16);
}

const getRangeMin = (now) => {
    const yesterDayMin = new Date(now);
    yesterDayMin.setDate(now.getDate() - 1);
    yesterDayMin.setUTCHours(0);
    yesterDayMin.setUTCMinutes(0);
    yesterDayMin.setUTCSeconds(0);
    yesterDayMin.setUTCMilliseconds(0);
    return yesterDayMin
}

const getRangeMax = (now) => {
    const yesterdayMax = new Date(now);
    yesterdayMax.setDate(now.getDate());
    yesterdayMax.setUTCHours(0);
    yesterdayMax.setUTCMinutes(0);
    yesterdayMax.setUTCSeconds(0);
    yesterdayMax.setUTCMilliseconds(0);
    return yesterdayMax;
}

const getRangeWeek = (now) => {
    const lastWeek = new Date(now);
    lastWeek.setDate(now.getDate() - 6);
    lastWeek.setUTCHours(0);
    lastWeek.setUTCMinutes(0);
    lastWeek.setUTCSeconds(0);
    lastWeek.setUTCMilliseconds(0);
    return lastWeek;
}

const createMessage = async (content, conversationId, userId, slug) => {

    const messageModel = new Message(content, conversationId, userId);
    const [response] = await insertRow('message', messageModel);
    const messageId = response.insertId;
    const [message] = (await pool.query(`
              select * from message where id = ${messageId}
            `))[0];
    return message;


}

const userInconversationExists = async (userId, conversationId) => {

    const response = await getOne(`select count(*) as count from user_conversation where userId = ? and conversationId = ?`, [userId, conversationId]);
    const exist = response.count > 0 ? true : false;
    if (exist) {
        return await getOne(`select * from conversation where id = ?`, [conversationId]);
    } else {
        return await Promise.resolve(null);
    }


}