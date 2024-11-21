import { BehaviorSubject } from "../../utils/behaviorsubject.js";
import authService, { JWT_ACCESS_TOKEN } from "./auth.js";
import cookieService from "./cookies.js";
class SocketService {
    constructor() {
        this.socketAuth = new BehaviorSubject(false);
        this.authService = authService;
        this.cookieService = cookieService;
    }
    
    initSocket() {
        const userId = this.cookieService.getCookie('userId');
        this.socket = io('http://localhost:3005', {
            query: {
                userId:userId
              }
        });
        this.socket.on("connect", () => {
            console.log(1);
            this.socketAuth.next(true);
        })
        this.socket.on("connect_error", (err) => {
            console.log(2);
            this.socketAuth.next(false);
        })

        this.socket.on("disconnect", (reason) => {
            console.log(3);
            this.socketAuth.next(false);
        })

        this.socket.on('messaged', (ev) => {
            console.log(ev);
        })
        
    }
    

    closeConnection() {
        if(this.socket) {
            this.socket.close();
        }
    }

    reconnectSocket() {
        this.socket.io.opts.query = {token: localStorage.getItem(JWT_ACCESS_TOKEN)};
        this.socket.disconnect();
        this.socket.connect();
    }

    handleAuthStateChange() {
        this.authService.authStateChange.subscribe(logged => {
          if(logged) {
            this.reconnectSocket();
          } else {
            this.closeConnection();
          }
        })
    }

    emit() {
        
    }

    getMessage() {
        return new Promise((resolve, reject) => {
            this.socket.on('message-send', (data) => {
                resolve(data);
            });
        });
    }

}

const socketService = new SocketService();
export default socketService;