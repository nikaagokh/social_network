export class Conversation {
    constructor(name, couple, base = 0, lastMessageId = null, adminId = null) {
        this.name = name;
        this.couple = couple;
        this.base = base;
        this.lastMessageId = lastMessageId;
        this.adminId = adminId;
    }
}