import socketService from "./services/socket.js";
import bridgeService from "./services/bridge.js";
import { Message } from "./message.js";

function init() {
    socketService.initSocket();
    new Message();
}
window.addEventListener('DOMContentLoaded', init);