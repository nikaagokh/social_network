export class File {

    constructor(path='', messageId, extension, size, mime, name) {
        this.path = path;
        this.messageId = messageId;
        this.extension = extension;
        this.size = size;
        this.mime = mime;
        this.fileName = name;
    }
}