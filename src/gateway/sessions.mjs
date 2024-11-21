class GatewaySessionManager {
    constructor() {
        this.rooms = new Map();
        this.admin = null;
    }

    getRoom(conversationName) {
        if(!this.rooms.has(conversationName)) {
            this.rooms.set(conversationName, new Set());
        }
        return this.rooms.get(conversationName);
    }

    setInRoom(conversationName, socket) {
        if(!this.rooms.has(conversationName)) {
            this.rooms.set(conversationName, new Set());
        }
        this.rooms.get(conversationName).add(socket);
    }

    getRooms() {
        return this.rooms;
    }

    removeFromRoom(conversationName, socket) {
        if(this.rooms.has(conversationName)) {
            this.rooms.get(conversationName).delete(socket);
        }
    }

    removeSocket(socket) {
        const conversationId = socket.conversationId;
        const conversationName = `conv-${conversationId}`;
        const room = this.rooms.get(conversationName);
        if(room) {
            room.delete(socket);
        }
        
    }
}

const gatewaySessionManager = new GatewaySessionManager();
export default gatewaySessionManager;