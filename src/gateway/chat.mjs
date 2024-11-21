import eventEmitter from "../../emitter.js";
import { createServer } from "http";
import { Server } from 'socket.io';
import gatewaySessionManager from "./sessions.mjs";
import { getMany, getOne } from "../utils/index.mjs";

export const configureIO = (app) => {
    const server = createServer(app);
    const io = new Server(server);
    io.use(socketMiddleware);
    io.on('connection', (socket) => {
        const conversationIds = socket.conversationIds;
        conversationIds.forEach(conversationId => {
            const conversationName = `conv-${conversationId}`;
            const sockets = gatewaySessionManager.getRoom(conversationName);
            if(sockets.size === 0) {
                socket.emit('onOnline', {conversationId:conversationId, online:false});
            } else {
                sockets.forEach(usocket => {
                    if(usocket.userId !== socket.userId) {
                        usocket.emit('onOnline', {conversationId:conversationId, online:true});
                    }
                })
            }
            gatewaySessionManager.setInRoom(conversationName, socket);
        })
        socket.on('onTyping', async ({typing}) => {
            const conversationIds = socket.conversationIds;
            conversationIds.forEach(conversationId => {
                const conversationName = `conv-${conversationId}`;
                const sockets = gatewaySessionManager.getRoom(conversationName);
                const {firstName, lastName} = socket.user;
                const userObject = {firstName, lastName, typing};
                sockets.forEach(usocket => {
                    if(usocket.userId !== socket.userId) {
                        usocket.emit('onTyping', userObject);
                    }
                })
            })
        })
        
        socket.on("disconnect", () => {
            const conversationIds = socket.conversationIds;
            conversationIds.forEach((conversationId, i) => {
                const conversationName = `conv-${conversationId}`;
                gatewaySessionManager.removeFromRoom(conversationName, socket);
                const sockets = gatewaySessionManager.getRoom(conversationName);
                if(sockets.size <= 1) {
                    sockets.forEach(socket => {
                        socket.emit('onOnline', {conversationId:conversationId, online:false});
                    })
                } else {
                    sockets.forEach(usocket => {
                        if(usocket.userId !== socket.userId) {
                            usocket.emit('onOnline', {conversationId:conversationId, online:true});
                        }
                    })
                }
            })
           
            
        })
           
    })
    
    eventEmitter.on('file.send', (ev) => {
        const message = ev.message;
        const conversationId = ev.conversationId;
        const conversationName = getConvName(conversationId);
        const sockets = gatewaySessionManager.getRoom(conversationName);
        sockets.forEach(socket => {
            if(socket.userId !== message.userId) {
                message.sent = false;
                socket.emit('onMessage', message);
            }
        })
    })
    eventEmitter.on('message.send', (ev) => {
        const message = ev.message;
        const conversationId = ev.conversation.id;
        const conversationName = getConvName(conversationId);
        const sockets = gatewaySessionManager.getRoom(conversationName);
        sockets.forEach(socket => {
            if(socket.userId !== message.userId) {
                message.sent = false;
                socket.emit('onMessage', message);
                socket.emit('onTyping', {typing:false})
            }
        })
    });
    
    eventEmitter.on('user.added', (ev) => {
    
    });
    

    server.listen(3005, () => {
        console.log('listening');
    })
}


const socketMiddleware = async (socket, next) => {
    let userId = socket.handshake.query?.userId;
    if(userId && userId !== 'null') {
        userId = Number(userId);
        socket.userId = userId;
        const conversations = await getMany('select c.id from conversation as c left join user_conversation as uc on uc.conversationId = c.id where uc.userId = ?', [userId]);
        const arrayOfNumbers = conversations.map(obj => obj.id);
        socket.conversationIds = arrayOfNumbers;
        console.log(socket.conversationIds);
        const user = await getOne('select firstName, lastName from user where id = ?', [userId]);
        socket.user = user;
        next();
        
    } 
    
   
}

const getConvName = (conversationId) => {
   return `conv-${conversationId}`;
}