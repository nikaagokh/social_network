import overlayService from "./services/overlay.js";
import httpService from "./services/http.js";
import socketService from "./services/socket.js";
export class Message {
    constructor() {
        this.socketService = socketService;
        this.httpService = httpService;
        this.overlayService = overlayService;
        this.messageIcon = document.querySelector('#messageButton');
        this.messageBadge = document.querySelector('#messageBadge');
        this.isSeen = false;
        this.isOpened = false;
        this.audioMessage = document.querySelector('#audioMessage');
        this.listeners();
        this.fetchData();
    }

    fetchData() {
        this.httpService.getUnseenMessages().then(seen => {
            this.isSeen = seen;
            this.messageBadgeState();
        })
    }

    listeners() {
        this.overlayService.chatState.subscribe(value => this.isOpened = value);
        this.messageIcon.addEventListener("click", () => {
            this.isSeen = true;
            this.messageBadgeState();
            this.overlayService.openChat();
        })
        this.socketService.socket.on('onMessage', () => {
            if(!this.isOpened) {
                console.log('isnotopened')
                this.isSeen = false;
                this.messageBadgeState();
                this.audioMessage.play();
            }
        })
    }
    messageBadgeState() {
        if(this.isSeen) {
            this.messageBadge.style.display = 'none';
        } else {
            this.messageBadge.style.display = 'block';
        }
    }
}