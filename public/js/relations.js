import overlayService from "./services/overlay.js";
import httpService from "./services/http.js";
import { YouSure } from "./you-sure.js";
import { disableScroll } from "../utils/disableScroll.js";
import { enableScroll } from "../utils/enableScroll.js";
export class Relations {
    constructor() {
        this.overlayService = overlayService;
        this.httpService = httpService;
        this.moreOptions = null;
        this.youSureBox = null;
        
        this.inRelationsList = document.querySelector('.in-relations-list');
        this.outRelationsList = document.querySelector('.out-relations-list');
        this.inrelationsButtons = document.querySelectorAll('.in-relations-more');
        this.outrelationsButtons = document.querySelectorAll('.out-relations-more');
        this.relationsSendButton = document.querySelector('#relationsSendButton');
        this.relationsReceiveButton = document.querySelector('#relationsReceiveButton');
        this.activeList = 0;
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        this.listeners();
    }

    listeners() {
        this.relationsSendButton.addEventListener('click', () => {
            this.activeList = 0;
            this.inRelationsList.style.display = 'flex';
            this.outRelationsList.style.display = 'none';
            this.relationsSendButton.classList.toggle('button-active');
            this.relationsReceiveButton.classList.toggle('button-active');
        })

        this.relationsReceiveButton.addEventListener('click', () => {
            this.activeList = 1;
            this.inRelationsList.style.display = 'none';
            this.relationsSendButton.classList.toggle('button-active');
            this.relationsReceiveButton.classList.toggle('button-active');
            this.outRelationsList.style.display = 'flex';
        })
        this.inrelationsButtons.forEach(relationButton => {
            relationButton.addEventListener('click',() => {
                this.openMoreOptions(relationButton);
            })
        })

        this.outrelationsButtons.forEach(relationButton => {
            relationButton.addEventListener('click', () => {
                this.openMoreOptions(relationButton);
            })
        });
    }

    openMoreOptions(moreButton) {
        if(!this.moreOptions) {
            this.moreOptions = this._createMoreOptions();
            moreButton.appendChild(this.moreOptions);
            this.friendshipId = Number(moreButton.getAttribute('data-requestId'));
            this.userId = Number(moreButton.parentElement.getAttribute('data-userId'));
            this.moreButtonListeners();
        }
    }

    _createMoreOptions() {
        const template = `
        <div class="chat-group-append">
             ${this.activeList === 1 ? `
                <button class="button relations-decline" id="relationsAccept">
                  <i class="material-symbols-outlined settings-icon">check</i>
                  <span>დადასტურება</span>
                </button>
                `: ''}
             <button class="button relations-decline" id="relationsDecline">
               <i class="material-symbols-outlined settings-icon">backspace</i>
               <span>გაუქმება</span>
             </button>
             <button class="button relations-block" id="relationsBlock">
               <i class="material-symbols-outlined settings-icon">block</i>
               <span>დაბლოკვა</span>
             </button>
           </div>
      `;
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = template;
      return tempContainer.firstElementChild;
    }

    moreButtonListeners() {
        const relationsDecline = this.moreOptions.querySelector('#relationsDecline');
        const relationsBlock = this.moreOptions.querySelector('#relationsBlock');
        const relationsAccept = this.moreOptions.querySelector('#relationsAccept');
        relationsDecline.addEventListener('click', () => {
            this.detachMoreOptions();
            this.openQuestion('ნამდვილად გსურთ მოთხოვნის გაუქმება?', 'დახურვა', 'გაუქმება', 0)
        });

        relationsBlock.addEventListener('click', () => {
            this.detachMoreOptions();
           this.openQuestion('ნამდვილად გსურთ ამ იუზერის დაბლოკვა?', 'დახურვა', 'დაბლოკვა', 3);
        })
        if(relationsAccept) {
            console.log(relationsAccept)
            relationsAccept.addEventListener('click', () => {
                console.log(this.userId)
                this.httpService.changeFriendshipStatus(this.userId, 1).then(s => {
                    console.log(s);
                }).catch(e => {
                    console.log(e)
                })
            })
        }

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

    openQuestion(message, decline, accept, status=null) {
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
                this.httpService.changeFriendshipStatus(this.userId, status).then(s => {
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

    changeFrindStatus(status) {
        this.httpService.changeFriendshipStatus(this.friendshipId, status).then(s => {
            console.log(s);
        }).catch(e => {
            console.log(e)
        })
    }

    changeBlockStatus(status) {
        this.httpService.changeBlockStatus(this.userId, status)
    }
}


