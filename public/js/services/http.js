import toastService from "./toast.js";
import authService from "./auth.js";
import cookieService from "./cookies.js";
import { BehaviorSubject } from "../../utils/behaviorsubject.js";
class HttpService {
    
    constructor() {
        this.cookieService = cookieService;
        this.toastService = toastService;
        this.cartObject = { products: [], total: 0, discount: 0 };
        this.favObject = { products: [], total: 0, discount: 0 };
        this.authService = authService;
        this.authService.authStateChange.subscribe(x => {
            this.authed = x;
        })
        this.authService.isAuthenticated().then(x => this.authed = x);
        if (localStorage.getItem('cart')) {
            console.log(localStorage.getItem('cart'))
            const cartObject = JSON.parse(localStorage.getItem('cart'));
            const { total, discount } = cartObject.products.reduce((acc, item) => {
                acc.total += item.price * item.quantity;
                acc.discount += ((item.price * item.discount) / 100) * item.quantity;
                return acc;
            }, { total: 0, discount: 0 });
            this.cartObject = { products: cartObject.products, total: total, discount: discount };
            this.cartProducts$ = new BehaviorSubject(this.cartObject);
        } else {
            this.cartProducts$ = new BehaviorSubject(this.cartObject);
        }
    }

    async fetchStore(section) {
        const lng = this.getLanguage();
        return fetch(`http://localhost:3001/${lng}/api/lng/translate?section=${section}`)
            .then(res => {
                return res.json();
            });
    }

    getLanguage() {
        const url = window.location.pathname;
        return url.split('/')[1];
    }

    async initChat(conversationId) {
        return fetch(`http://localhost:3005/api/chat/init/${conversationId}`)
        .then(res => {
            if(!res.ok) {
                throw new Error('Error Ocurred');
            }
            return res.json();
        })
    }
    /*
    async initChat() {
        return fetch('http://localhost:3005/api/chat/init')
        .then(res => {
            if(!res.ok) {
                throw new Error('Error Ocurred');
            }
            return res.json();
        });
    }
    */

    async sendFile(filesInf, conversationId) {
        const formData = new FormData();
        formData.append('data', JSON.stringify({conversationId}));
        filesInf.forEach((file, i) => {
            formData.append('file', file);
        })
        return fetch('http://localhost:3005/api/chat/send/file', {
            method:"POST",
            body:formData
        }).then(res => {
            if(!res.ok) {
                throw new Error('Error Ocurred');
            }
            return res.json();
        })
    }

    async sendMessage(content, conversationId, slug) { 
        
        const sendObject = {content, conversationId, slug};
        return fetch('http://localhost:3005/api/chat/send/message', {
            method:"POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body:JSON.stringify(sendObject)
        })
        .then(response => {
            if(!response.ok) {
                throw new Error('');
            }
            return response.json();
        })
    }

    async getMoreMessages(offset, conversationId) {
        return fetch(`http://localhost:3005/api/chat/more/messages?offset=${offset}&conversationId=${conversationId}`)
        .then(res => {
            if(!res.ok) {
                throw new Error('Error Ocurred');
            }
            return res.json();
        });
    }

    async getMediaFiles(conversationId, filename, offset=1) {
        return fetch(`http://localhost:3005/api/chat/media?fileName=${filename}&conversationId=${conversationId}&offset=${offset}`)
        .then(res => {
            if(!res.ok) {
                throw new Error('Error Ocurred');
            }
            return res.json();
        })
    }

    async getDocsFiles(conversationId) {
        return fetch(`http://localhost:3005/api/chat/docs/${conversationId}`)
        .then(res => {
            if(!res.ok) {
                throw new Error('Error Ocurred');
            }
            return res.json();
        })
    }

    async getFileMessages(filename, conversationId, offset) {
        return fetch(`http://localhost:3005/api/chat/files?offset=${offset}&conversationId=${conversationId}&filename=${filename}`)
        .then(res => {
            if(!res.ok) {
                throw new Error('Error Ocurred');
            }
            return res.json();
        });
    }

    async getDownloadedFile(fileName) {
        return fetch(`http://localhost:3005/api/chat/download/${fileName}`)
        .then(res => {
            if(!res.ok) {
                throw new Error('Error ocurred');
            }
            return res.blob();
        })
    }

    async addSeenToConversation(conversationId) {
        return fetch(`http://localhost:3005/api/chat/seen`, {
            method:"POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body:JSON.stringify({conversationId})
        }).then(res => {
            if(!res.ok) {
                throw new Error('Error Ocurred');
            }
            return res.json();
        })
    }

    async getUnseenMessages() {
        return fetch(`http://localhost:3005/api/chat/unseen/messages`)
        .then(res => {
            if(!res.ok) {
                throw new Error('Error Ocurred');
            }
            return res.json();
        });
    }

    async getChatUsers(conversationId) {
        console.log(conversationId)
        return fetch(`http://localhost:3005/api/chat/users/${conversationId}`)
        .then(res => {
            if(!res.ok) {
                throw new Error('Error Ocurred');
            }
            return res.json();
        });

    }

    async getCommunication(userId) {
        console.log(userId)
        return fetch(`http://localhost:3005/api/chat/communication/${userId}`)
        .then(res => {
            if(!res.ok) {
                throw new Error('Error Ocurred');
            }
            return res.json();
        });
    }

    async manageFriendShip(toId) {
        
        return fetch(`http://localhost:3005/api/chat/friendship`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({toId})
        })
        .then(res => {
            if(!res.ok) {
                throw new Error('Error Ocurred');
            }
            return res.json();
        });
    }

    async changeFriendshipStatus(userId, status) {
        const object = {userId, status};
        return fetch('http://localhost:3005/api/chat/status-friendship', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(object)
        }).then(res => {
            if(!res.ok) {
                throw new Error('Error Ocurred');
            }
            return res.json();
        });
    }

    async changeBlockStatus(userId, status) {
        const object = {userId, status};
        return fetch('http://localhost:3005/api/chat/status-block', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(object)
        }).then(res => {
            if(!res.ok) {
                throw new Error('Error Ocurred');
            }
            return res.json();
        });
    }

    async addGroup(userIds, adminId, groupName) {
        const object = {userIds, adminId, groupName};
        return fetch('http://localhost:3005/api/chat/create/group', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(object)
        }).then(response => {
            if(!response.ok) {
                throw new Error('Error Ocurred');
            }
            return response.json();
        })
    }
}

const httpService = new HttpService();
export default httpService;