class BridgeService {
    constructor() {
        this.chatState = document.createElement('div');
    }

    openChat() {
        this.chatState.dispatchEvent(new CustomEvent('state', {detail:true}));
    }

    closeChat() {
        this.chatState.dispatchEvent(new CustomEvent('closed', {detail:false}));
    }
}

const bridgeService = new BridgeService();
export default bridgeService;