import overlayService from "./services/overlay.js";
import httpService from "./services/http.js";
import { YouSure } from "./you-sure.js";
import { disableScroll } from "../utils/disableScroll.js";
import { enableScroll } from "../utils/enableScroll.js";

export class Contacts {
    constructor() {
        this.overlayService = overlayService;
        this.httpService = httpService;
        this.moreOptions = null;
        this.youSureBox = null;
        this.contactsButtons = document.querySelectorAll('.contacts-buttons');
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        this.listeners();
    }

    listeners() {
        console.log(this.contactsButtons)
        this.contactsButtons.forEach(contactButton => {
            contactButton.addEventListener('click', () => {
                this.openMoreOptions(contactButton);
                console.log('ae')
            })
        })
    }

    openMoreOptions(moreButton) {
        if(!this.moreOptions) {
            this.moreOptions = this._createMoreOptions();
            moreButton.appendChild(this.moreOptions);
            this.userId = Number(moreButton.getAttribute('data-id'));
            console.log(moreButton)
            console.log(this.userId);
            this.moreButtonListeners(this.userId);
        }
    }

    _createMoreOptions() {
        const template = `
          <div class="chat-group-append">
               <button class="button chat-more-button" id="contactDelete">
                 <i class="material-symbols-outlined settings-icon">delete</i>
                 <span>წაშლა</span>
               </button>
               <button class="button chat-more-button" id="contactBlock">
                 <i class="material-symbols-outlined settings-icon">block</i>
                 <span>დაბლოკვა</span>
               </button>
             </div>
        `;
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = template;
        return tempContainer.firstElementChild;
    }

    moreButtonListeners(userId) {
        console.log(userId);
        const contactDelete = this.moreOptions.querySelector('#contactDelete');
        const contactBlock = this.moreOptions.querySelector('#contactBlock');
        contactDelete.addEventListener('click', () => {
            this.openQuestion('ნამდვილად გსურთ ამ მომხმარებლის წაშლა?', 'დახურვა', 'წაშლა', userId, 0);
        });

        contactBlock.addEventListener('click', () => {
            this.openQuestion('ნამდვილად გსურთ ამ მომხმარებლის დაბლოკვა?', 'დახურვა', 'დაბლოკვა', userId, 3);
        })

        setTimeout(() => document.addEventListener('click', this.handleOutsideClick), 0);
    }

    handleOutsideClick(ev) {
        const inside = ev.composedPath().some(el => {
            return this.moreOptions === el;
        });
        if (!inside) {
            this.detachMoreOptions();
        }
    }

    detachMoreOptions() {
        this.moreOptions.remove();
        this.moreOptions = null;
        document.removeEventListener('click', this.handleOutsideClick);
    }

    openQuestion(message, decline, accept, userId, status=null) {
        if(!this.youSureBox) {
            const { globalWrapper, dialogBackdrop, dialogComponent } = this.overlayService.createDialog();
            this.youSureBox = new YouSure(message, decline, accept);
            dialogComponent.appendChild(this.youSureBox.element);
            globalWrapper.appendChild(dialogComponent);
            disableScroll();
            this.overlayService.overlayContainer.appendChild(dialogBackdrop);
            this.overlayService.overlayContainer.appendChild(globalWrapper);
            dialogBackdrop.addEventListener('click', () => {
                this.youSureBox = null;
                dialogBackdrop.remove();
                globalWrapper.remove();
                enableScroll();
            })

            this.youSureBox.accept$.addEventListener('accepted', () => {
                this.youSureBox = null;
                dialogBackdrop.remove();
                globalWrapper.remove();
                enableScroll();
                this.httpService.changeFriendshipStatus(userId, status).then(s => {
                    console.log(s);
                }).catch(e => {
                    console.log(e)
                })
            });

            this.youSureBox.decline$.addEventListener('declined', () => {
                this.youSureBox = null;
                dialogBackdrop.remove();
                globalWrapper.remove();
                enableScroll();
            })
        }
    }
}

