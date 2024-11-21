import socketService from "./services/socket.js";
import httpService from "./services/http.js";
import toastService from "./services/toast.js";
import spinnerService from "./services/spinner.js";
import overlayService from "./services/overlay.js";
export class Conversations {
    constructor() {
        this.overlayService = overlayService;
        this.chatByUsers = document.querySelectorAll('.open-chat-user');
        this.chatByConversations = document.querySelectorAll('.open-chat-conversation');
        this.listeners();
    }

    listeners() {
        this.chatByUsers.forEach(chatButton => {
            chatButton.addEventListener('click', () => {
                const userId = chatButton.getAttribute('data-id');
                console.log(chatButton)
                const userIdentity = this.getIdentity(chatButton);
                console.log(userId)
                this.overlayService.openCommunication(userId, userIdentity);
            })
        });
        
        this.chatByConversations.forEach(convButton => {
            convButton.addEventListener('click', () => {
                const conversationId = Number(convButton.getAttribute('data-id'));
                const chatIdentity = this.getIdentity(convButton);
                console.log(conversationId);
                console.log(chatIdentity)
                this.overlayService.openChat(conversationId, chatIdentity);
            })
        })
    }

    getIdentity(chatButton) {
        const previousSibling = chatButton.previousElementSibling;
        return (previousSibling.querySelector('div')).textContent;
    }
}


function init() {
    socketService.initSocket();
    new Conversations();
}

window.addEventListener('DOMContentLoaded', init);