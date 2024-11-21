export class UserConversation {
    constructor(userId, conversationId, seen = 1) {
        this.userId = userId;
        this.conversationId = conversationId;
        this.seen = seen;
    }
}