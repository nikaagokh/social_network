import overlayService from "./services/overlay.js";
import httpService from "./services/http.js";
import { YouSure } from "./you-sure.js";
import { disableScroll } from "../utils/disableScroll.js";
import { enableScroll } from "../utils/enableScroll.js";

export class Blocks {
    constructor() {
        console.log('aeeeee')
        this.overlayService = overlayService;
        this.httpService = httpService;
        this.moreOptions = null;
        this.youSureBox = null;
        this.unblockButtons = document.querySelectorAll('.unblock-buttons');
        this.listeners();
    }

    listeners() {
        this.unblockButtons.forEach(unblockButton => {
            unblockButton.addEventListener('click', () => {
                console.log('ae')
                const userId = unblockButton.getAttribute('data-id');
                this.openQuestion('ნამდვილად გსურთ ამ მომხმარებელს ბლოკი მოხსნათ?', 'უარყოფა', 'დადასტურება', userId, 0)
            })
        })
    }

    openQuestion(message, decline, accept, userId ,status=null) {
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

