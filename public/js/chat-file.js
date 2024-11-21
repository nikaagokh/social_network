import httpService from "./services/http.js";
import overlayService from "./services/overlay.js";
import { YouSure } from "./you-sure.js";
export class ChatDocs {
    constructor(conversationId) {
        this.httpService = httpService;
        this.overlayService = overlayService;
        this.conversationId = conversationId;
        this.moreOptions = null;
        this.close$ = document.createElement('div');
        this.element = this._createElement();
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        this.docsContainer = this.element.querySelector('.modal-list');
        this.spinnerContainer = this.element.querySelector('.spinner-container');
        this.closeButton = this.element.querySelector('#chatGroupClose');
        this.fetchData();
        this.listeners();
    }

    _createElement() {
        const template = `
         <div class="modal-container">
            <div class="header-modal">
                <div class="header-desc">
                    <h3>ფაილები</h3>
                    <button class="button button-icon" id="chatGroupClose">
                      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none">
                       <path d="M5.34995 12.0875L8.49995 8.93745L11.65 12.0875L12.0875 11.65L8.93745 8.49995L12.0875 5.34995L11.65 4.91245L8.49995 8.06245L5.34995 4.91245L4.91245 5.34995L8.06245 8.49995L4.91245 11.65L5.34995 12.0875ZM8.50376 16.1125C7.45122 16.1125 6.46151 15.9127 5.53462 15.5133C4.60772 15.1138 3.80144 14.5717 3.11579 13.8869C2.43016 13.2021 1.88736 12.3969 1.48739 11.4711C1.08743 10.5454 0.887451 9.5563 0.887451 8.50376C0.887451 7.45122 1.08718 6.46151 1.48663 5.53462C1.8861 4.60772 2.42822 3.80145 3.11299 3.11581C3.79778 2.43016 4.60304 1.88736 5.52876 1.4874C6.45448 1.08743 7.44361 0.887451 8.49615 0.887451C9.54868 0.887451 10.5384 1.08718 11.4653 1.48663C12.3922 1.8861 13.1985 2.42822 13.8841 3.11299C14.5697 3.79778 15.1125 4.60304 15.5125 5.52876C15.9125 6.45448 16.1125 7.44361 16.1125 8.49615C16.1125 9.54868 15.9127 10.5384 15.5133 11.4653C15.1138 12.3922 14.5717 13.1985 13.8869 13.8841C13.2021 14.5697 12.3969 15.1125 11.4711 15.5125C10.5454 15.9125 9.5563 16.1125 8.50376 16.1125ZM8.49995 15.5C10.4541 15.5 12.1093 14.8218 13.4656 13.4656C14.8218 12.1093 15.5 10.4541 15.5 8.49995C15.5 6.54578 14.8218 4.89058 13.4656 3.53433C12.1093 2.17808 10.4541 1.49995 8.49995 1.49995C6.54578 1.49995 4.89058 2.17808 3.53433 3.53433C2.17808 4.89058 1.49995 6.54578 1.49995 8.49995C1.49995 10.4541 2.17808 12.1093 3.53433 13.4656C4.89058 14.8218 6.54578 15.5 8.49995 15.5Z" fill="#1C1B1F"/>
                      </svg>
                    </button>
                </div>    
            </div>
            <div class="modal-body">
              <div class="spinner-container">
                 <svg class="spinner" width="35px" height="35px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
                   <circle class="path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle>
                 </svg>
              </div>
              <div class="modal-list"></div>
            </div>
         </div>
         
        `;
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = template;
        return tempContainer.firstElementChild;
    }

    async fetchData() {
        this.loaded = false;
        this.handleLoadingState();
        this.docs = await this.httpService.getDocsFiles(this.conversationId);
        this.renderDocs();
        this.loaded = true;
        this.handleLoadingState();
        
    }

    listeners() {
        /*
        const moreButtons = this.element.querySelectorAll('.chatgroup-more');
        moreButtons.forEach(moreButton => {
            moreButton.addEventListener('click', () => {
                this.openMoreOptions(moreButton);
            })
        })
        */
       const downloadButtons = this.element.querySelectorAll('.chat-file-download');
       downloadButtons.forEach((downloadButton, i) => {
           downloadButton.addEventListener('click', () => {
             const fileName = this.docs[i].path;
             this.httpService.getDownloadedFile(fileName)
                .then(blob => {
                    const downloadUrl = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = downloadUrl;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(downloadUrl);
                    document.body.removeChild(a);
                })
           })
       })

        this.closeButton.addEventListener('click', () => {
            this.close$.dispatchEvent(new CustomEvent('closed'));
        })
    }

    getFileName(downloadButton) {
       

    }

    handleLoadingState() {
        if(this.loaded) {
            this.spinnerContainer.style.display = 'none';
            this.docsContainer.style.display = 'block';
        } else {
            this.spinnerContainer.style.display = 'block';
            this.docsContainer.style.display = 'none';
        }
    }

    renderDocs() {
        this.docsContainer.innerHTML = '';
        const template = this.docs.map(doc => `
         <div class="chatgroup-item list-divider" tabindex="0" data-id="${doc.id}">
            <i class="material-symbols-outlined chatgroup-user-icon">description</i>
            <span class="list-item-content">
                <h4 class="list-item-title">${doc.fileName}</h4>
                <p class="list-item-line">${doc.size} kb</p>
            </span>
            <button class="button button-icon chat-file-download" data-id="${doc.file_id}">
                <i class="material-symbols-outlined">download</i>
            </button>
        </div>
        `).join('');
        this.docsContainer.innerHTML = template;
        this.listeners();
    }

    openMoreOptions(moreButton) {
        if(!this.moreOptions) {
            this.moreOptions = this._createMoreOptions();
            moreButton.appendChild(this.moreOptions);
            const userId = Number(moreButton.getAttribute('data-id'));
            const userIdentity = moreButton.previousElementSibling.querySelector('.list-item-title').textContent;
            
            this.closeButton.previousElementSibling
            this.moreButtonListeners(userId, userIdentity);
        }
    }

    _createMoreOptions() {
        const template = `
          <div class="chat-group-append">
               <button class="button chat-more-button" id="chatMessage">
                 <i class="material-symbols-outlined settings-icon">chat</i>
                 <span>შეტყობინება</span>
               </button>
               <button class="button chat-more-button" id="chatBlock">
                 <i class="material-symbols-outlined settings-icon">block</i>
                 <span>დაბლოკვა</span>
               </button>
             </div>
        `;
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = template;
        return tempContainer.firstElementChild;
    }

    moreButtonListeners(userId, userIdentity) {
        const chatMessage = this.moreOptions.querySelector('#chatMessage');
        const chatBlock = this.moreOptions.querySelector('#chatBlock');
        chatMessage.addEventListener('click', () => {
            this.comm$.dispatchEvent(new CustomEvent('commed', {detail:{userId, userIdentity}}));
        });

        chatBlock.addEventListener('click', () => {
           this.overlayService.openQuestion('ნამდვილად გსურთ ამ იუზერის დაბლოკვა?', 'დახურვა', 'დაბლოკვა');
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

    detach() {}
}