export class Message {

    constructor(content='', conversationId, userId, type = 0) {
        this.content = content;
        this.conversationId = conversationId;
        this.userId = userId;
        this.type = type;
    } 
    addTime(time) {
        this.time = time;
    }
}