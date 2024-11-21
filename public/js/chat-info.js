import overlayService from "./services/overlay.js";

export class ChatInfo {
    constructor(chatType) {
        this.overlayService = overlayService;
        this.chatType = chatType;
        this.close$ = document.createElement('div');
        this.chatGroup$ = document.createElement('div');
        this.chatImages$ = document.createElement('div');
        this.chatDocs$ = document.createElement('div');
        this.chatLeave$ = document.createElement('div');
        this.chatBlock$ = document.createElement('div');
        this.chatUncontact$ = document.createElement('div');
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        this.element = this._createElement();
        this.chatGroup = this.element.querySelector('#chatGroup');
        this.chatImages = this.element.querySelector('#chatImages');
        this.chatDocs = this.element.querySelector('#chatDocs');
        this.chatLeave = this.element.querySelector('#chatLeave');
        this.chatBlock = this.element.querySelector('#chatBlock');
        this.chatUncontact = this.element.querySelector('#chatUnContact');
        this.listeners();
    }

    _createElement() {
        let template;
        if(this.chatType === 0) {
            template = this.getCommunicationTemplate();
        } else {
            template = this.getChatTemplate();
        }

        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = template;
        return tempContainer.firstElementChild;
    }

    getCommunicationTemplate() {
        const template = `
             <div class="chat-info-append">
               <button class="button chat-more-button" id="chatImages">
                 <i class="material-symbols-outlined settings-icon">image</i>
                 <span>ფოტოები</span>
               </button>
               <button class="button chat-more-button" id="chatDocs">
                <i class="material-symbols-outlined settings-icon">text_snippet</i>
                <span>ფაილები</span>
               </button>
               <button class="button chat-more-button" id="chatUnContact">
                 <i class="material-symbols-outlined settings-icon">person_remove</i>
                <span>კონტაქტის წაშლა</span>
               </button>
               <button class="button chat-more-button" id="chatBlock">
                <i class="material-symbols-outlined settings-icon">block</i>
                <span>დაბლოკვა</span>
               </button>
             </div>
        `;

        return template;
    }

    getChatTemplate() {
        const template = `
             <div class="chat-info-append">
               <button class="button chat-more-button" id="chatGroup">
                <i class="material-symbols-outlined settings-icon">group</i>
                <span>ჯგუფის წევრები</span>
               </button>
               <button class="button chat-more-button" id="chatImages">
                 <i class="material-symbols-outlined settings-icon">image</i>
                 <span>ფოტოები</span>
               </button>
               <button class="button chat-more-button" id="chatDocs">
                <i class="material-symbols-outlined settings-icon">text_snippet</i>
                <span>ფაილები</span>
               </button>
               <button class="button chat-more-button" id="chatLeave">
                <i class="material-symbols-outlined settings-icon">logout</i>
                <span>ჯგუფის დატოვება</span>
               </button>
             </div>
        `;

        return template;
    }

    listeners() {
        setTimeout(() => document.addEventListener('click', this.handleOutsideClick), 0);
        if(this.chatGroup) {
            this.chatGroup.addEventListener('click', () => {
                this.chatGroup$.dispatchEvent(new CustomEvent('group'));
            })
        }
        if(this.chatLeave) {
            this.chatLeave.addEventListener('click', () => {
                this.chatLeave$.dispatchEvent(new CustomEvent('leave'));
            })
        }
        if(this.chatBlock) {
            this.chatBlock.addEventListener('click', () => {
                this.chatBlock$.dispatchEvent(new CustomEvent('block'));
            })
        }
        if(this.chatUncontact) {
            this.chatUncontact.addEventListener('click', () => {
                this.chatUncontact$.dispatchEvent(new CustomEvent('uncontact'));
            })
        }
        this.chatImages.addEventListener('click', () => {
            this.chatImages$.dispatchEvent(new CustomEvent('images'));
        })
        this.chatDocs.addEventListener('click', () => {
            this.chatDocs$.dispatchEvent(new CustomEvent('docs'));
        })
        
    }

    handleOutsideClick(ev) {
        const inside = ev.composedPath().some(el => {
            return this.element === el;
        });
        
        if (!inside) {
            this.detach();
        }
    }

    detach() {
        document.removeEventListener("click", this.handleOutsideClick);
        this.close$.dispatchEvent(new CustomEvent('closed'));
    }


}