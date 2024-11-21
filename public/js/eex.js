constructor(userId, userIdentity) {
    //services
    this.overlayService = overlayService;
    this.socketService = socketService;
    this.httpService = httpService;
    //variables 
    this.userId = userId;
    this.userIdentity = userIdentity;
    this.mode = cookieService.getCookie('mode');
    this.close$ = document.createElement('div');
    this.loaded = false;
    this.firstOpen = true;
    this.offset = 1;
    this.images = [];
    this.filesInf = [];
    this.filePreviewBox = null;
    this.timeoutId = 0;
    this.chatType = 0;
    this.element = this._createElement();
    // elements
    this.messagesContainer = this.element.querySelector("#messagesContainer");
    this.spinnerContainer = this.element.querySelector('.chat-spinner');
    this.chatWrapper = this.element.querySelector('.chat-wrapper');
    this.chatFlex = this.element.querySelector('.chat-flex');
    this.chatForm = this.element.querySelector('.chat-form');
    this.chatHeader = this.element.querySelector('.chat-header');
    this.sendButton = this.element.querySelector('#messageSend');
    this.messageInput = this.element.querySelector('#messageInput');
    this.closeButton = this.element.querySelector('#chatCloseButton');
    this.moreButton = this.element.querySelector('#chatMoreButton');
    this.typingContainer = this.element.querySelector('#typingContainer');
    this.typingText = this.element.querySelector('#typingText');
    this.intersecting = this.element.querySelector('#intersecting');
    this.chatStatus = this.element.querySelector('#chatStatus');
    this.fileUploadInput = this.element.querySelector('#file-upload');
    this.fileContainer = this.element.querySelector('#filePreviews');
    this.downloadButtons = this.element.querySelectorAll('.chat-download-meta');
    // listeners
    this.handleEnter = this.handleEnter.bind(this);
    this.addMessage = this.addMessage.bind(this);
    this.handleInput = this.handleInput.bind(this);
    this.handleOnlineState = this.handleOnlineState.bind(this);
    this.chatMoreInfo = this.chatMoreInfo.bind(this);
    this.handleDebouncedOnlineState = this.debounce(this.handleOnlineState, 1500);
    this.listeners();
    this.fetchData();
}

_createElement() {
    const template = `
          <div class="chat-container" id="main-container">
<div class="chat-wrapper" id="chat-cont">
    <div class="chat-header">
        <div class="chat-status-wrapper">
          <span class="chat-status-line">სტატუსი</span>
          <span class="chat-status-icon" id="chatStatus"></span>
        </div>
        
        <span class="chat-header-title">${this.userIdentity}</span>
        <div class="chat-header-actions">
        <button class="button button-icon chat-more" id="chatMoreButton">
          <i class="material-symbols-outlined" style="font-size:18px;">more_horiz</i>
        </button>
        <button class="button button-icon" id="chatCloseButton">
          <i class="material-symbols-outlined" style="font-size:18px;">close</i>
        </button>
        </div>
   
        
    </div>
    <div class="chat-body chat-background id="chat-body">
        <div class="chat-flex" id="chat-flex">
            <div class="intersecting" id="intersecting"></div>
            <div class="message-container" id="messagesContainer"></div>
        </div>
        <div class="typing" id="userTyping" style="display:none;">
        </div>
        <div class="typing-container" id="typingContainer" style="display:none;">
        <span class="typing-text" id="typingText"></span>
        <div class="typing-elastic">
        <div class="dot-elastic"></div>
        </div>
        </div>
        
    </div>
</div>
<div class="chat-footer">
    <div class="chat-search-bottom">
         <label for="file-upload" class="custom-file-uploader">
            <i class="material-symbols-outlined">add</i>
        </label>
        <input type="file" multiple="multiple" id="file-upload" accept="image/jpeg, image/png, image/jpg" class="chat-upload-file">
        <div class="chat-input-wrapper">
        <div class="chat-file-previews" id="filePreviews">
          <div class="chat-file-card">
             <img src="/public/images/assets/auto1.png" width="30" height="30">
          </div>
        </div>
        <input type="text" id="messageInput" placeholder="" class="chat-input" autocomplete="off">
        </div>
        <button class="button button-icon" id="messageSend">
          <i id="sendMessageBtn" class="material-symbols-outlined send-message-icon">send</i>
        </button>
    </div>
    <div class="snippet" id="snippet" style="display: none;">
        <div class="stage">
            <div class="dot-elastic"></div>
        </div>
    </div>
</div>
<div class="chat-spinner">
     <svg class="spinner" width="35px" height="35px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
         <circle class="path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle>
     </svg>
</div>
</div>
    `
    const tempContainer = document.createElement("div");
    tempContainer.innerHTML = template;
    return tempContainer.firstElementChild;
};

async fetchData() {
    this.loaded = false;
    this.handleLoadingState();
    const chatObject = await this.httpService.getCommunication(this.userId);
    console.log(chatObject)
    this.messages = chatObject.messages;
    this.conversationId = chatObject.conversationId;
    this.online = chatObject.online;
    this.handleOnlineState();
    this.renderMessages();
    this.loaded = true;
    this.handleLoadingState();
    setTimeout(() => {
        this.scrollBottom();
    }, 0);
    
    //this.httpService.addSeenToConversation(this.conversationId);
    const intersectorListener = new Intersect(this.intersecting);
    intersectorListener.notifier$.addEventListener('intersected', (ev) => {
        if(this.firstOpen) {
            this.firstOpen = false;
            return;
        }
        if (ev.detail) {
            this.getMoreMessages();
        }

    })
}

listeners() {
    this.sendButton.addEventListener("click", this.addMessage);
    this.moreButton.addEventListener('click', this.chatMoreInfo);
    document.addEventListener("keydown", this.handleEnter);
    this.closeButton.addEventListener("click", () => {
        this.close$.dispatchEvent(new CustomEvent('closed'));
    });

    this.socketService.socket.on('onTyping', (data) => {
        const { typing, firstName, lastName } = data;
        if (typing) {
            this.typingText.textContent = `~ ${firstName + ' ' + lastName}`
            this.typingContainer.style.display = 'block';
        } else {
            this.typingText.textContent = ``
            this.typingContainer.style.display = 'none';
        }
        this.scrollBottom();
    })

    this.socketService.socket.on('onOnline', (online) => {
        this.online = online;
       
        this.handleDebouncedOnlineState();
    })

    this.socketService.socket.on('onMessage', (message) => {
        this.messages[this.messages.length - 1].messages.push(message);
       
        this.renderMessages();
        this.clearInput();
        this.scrollBottom();
    });

    this.messageInput.addEventListener('focus', () => {
        this.httpService.addSeenToConversation(this.conversationId)
    });

    this.messageInput.addEventListener('blur', () => {
        this.socketService.socket.emit('onTyping', { typing: false })
    });

    this.messageInput.addEventListener('input', this.handleInput);

    this.fileUploadInput.addEventListener('change', async (ev) => {
        const fileList = ev.target.files;
        this.fileContainer.style.display = 'flex';
        this.messageInput.style.borderRadius = '0 0 0.5rem 0.5rem';
       
        if (fileList) {
            const fileArray = Array.from(fileList);
            for (const file of fileArray) {
                const img = await this.getPreview(file);
                this.images.push(img);
                this.filesInf.push(file);
            }
            this.renderFilesPreview();
        }
    })
}

debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    }
};





renderFilesPreview() {
    const template = `
    ${this.images.map(image => `
        <div class="chat-file-card">
          <img src="${image}" width="40" height="40">
          <span class=" chat-file-meta">
             <i class="material-symbols-outlined" id="chatPreviewClose" style="font-size:20px; color:#000;">close</i>
          </span>
        </div>
    `)}
     
    `
    this.fileContainer.innerHTML = template;
    this.fileContainer.querySelectorAll('#chatPreviewClose').forEach((previewClose, i) => {
        previewClose.addEventListener('click', () => {
            this.removeFile(i);
            
            if (this.images.length === 0) {

                this.fileContainer.style.display = 'none';
                this.messageInput.style.borderRadius = '30px'
            }
        })
    })
}

async getPreview(file) {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.onload = (ev) => {
            resolve(ev.target.result);
        }
        fileReader.onerror = (e) => {
            reject(e);
        }
        fileReader.readAsDataURL(file);
    })
}

removeFile(index) {
    this.images.splice(index, 1);
    this.filesInf.splice(index, 1);
    this.renderFilesPreview();

}
handleOnlineState() {
    
    if (this.online) {
        this.chatStatus.classList.remove('chat-inactive');
        this.chatStatus.classList.add('chat-active');
    } else {
        this.chatStatus.classList.add('chat-inactive');
        this.chatStatus.classList.remove('chat-active');
    }
}
handleInput() {
    clearTimeout(this.timeoutId);
    const inputValue = this.messageInput.value;
    if (inputValue !== '') {
        this.socketService.socket.emit('onTyping', { typing: true });
    } else {
        this.socketService.socket.emit('onTyping', { typing: false });
    }
    this.timeoutId = setTimeout(() => {
        if (inputValue === this.messageInput.value) {
            this.socketService.socket.emit('onTyping', { typing: false });
        }
    }, 2000);
}

async addMessage() {
    const content = this.messageInput.value;
    if (content !== '' || this.images.length > 0) {
        const message = this.generateMessage(content);
        this.appendMessage(message);
        this.clearInput();
        this.scrollBottom();
        if (this.images.length === 0) {
            this.httpService.sendMessage(content, this.conversationId)
                .then(message => {
                    
                });
        } else {
            this.httpService.sendFile(this.filesInf, this.conversationId).then(s => {
                
            })
        }
        if(message.content !== '' && this.images.length > 0) {
            this.httpService.sendMessage(content, this.conversationId)
                .then(message => {
                   
                });
        }
        this.closePreview();
    }
}

async getMoreMessages() {
    this.offset++;
    const chatObject = await this.httpService.getMoreMessages(this.offset, this.conversationId);
    const lastMessagesLoaded = chatObject[0].messages;
    const lastMessagesInChat = this.messages[0].messages;
    if (lastMessagesLoaded[0].id !== lastMessagesInChat[0].id) {
        this.messages = chatObject;
        this.renderMessages();
        this.loaded = true;
        this.handleLoadingState();
        setTimeout(() => {
            this.loadScrollBottom();
        }, 0);
    }
}

appendMessage(message) {
    let template;
    if (message.type === 0) {
        template = `
          <div class="message-wrapper send sendlast">
            <div class="text-wrapper">${message.content}</div>
            <div class="message-inf">
              <span class="chat-time">${message.time}</span>
              <div class="check-container" style="display:none;">
               <i class="material-symbols-outlined">check</i>
              </div>
            </div>
            
          </div>
        `;
    } else {
        template = `
        ${this.images.map(image => `
            <div class="message-wrapper message-image-wrapper ${message.sent ? 'chat-img-sent' : 'chat-img-receive'}">
      <div class="chat-img-wrapper ${message.sent ? 'justify-end' : 'justify-start'}">
        ${message.sent ? `
        <button class="button button-icon chat-download-meta ${message.sent ? 'left0' : 'right0'}">
          <i class="material-symbols-outlined">download</i>
        </button>
        <img src="${image}" width="120" height="80" class="message-img">
        ` : `
          <img src="${image}" width="120" height="80" class="message-img">
           <button class="button button-icon chat-download-meta">
            <i class="material-symbols-outlined">download</i>
          </button>
        `}
      </div>
    </div>
        `).join('')}
        `;

        if(message.content !== '') {
            template += `
              <div class="message-wrapper send sendlast">
               <div class="text-wrapper">${message.content}</div>
                 <div class="message-inf">
                 <span class="chat-time">${message.time}</span>
                 <div class="check-container" style="display:none;">
                  <i class="material-symbols-outlined">check</i>
                 </div>
                </div>
              </div>
            `;
        }
        
    }
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = template;
    
    if(message.type === 0) {
        this.messagesContainer.append(tempContainer.firstElementChild);
    } else {
        const children = tempContainer.children;
        Array.from(children).forEach((child) => {
            this.messagesContainer.appendChild(child);
            child.addEventListener('click', () => {
                const src = child.getAttribute('src');
                this.overlayService.openChatZoom(src, this.conversationId);
            })
        })
    }
    
}

clearInput() {
    this.messageInput.value = '';
}

closePreview() {
    this.fileContainer.style.display = 'none';
    this.messageInput.style.borderRadius = '30px'
    this.images = [];
    this.filesInf = [];
}

scrollBottom() {
    const top = this.chatWrapper.scrollHeight;
    this.chatWrapper.scrollTo({
        top: top,
        behavior: 'instant'
    })
}

loadScrollBottom() {
    const top = this.chatWrapper.scrollTop + 400;
    this.chatWrapper.scrollTo({
        top: top,
        behavior: 'auto'
    })
}

getTime() {
    const dateUtc = new Date();
    const now = new Date(dateUtc.getTime() - dateUtc.getTimezoneOffset() * 60 * 1000);
    const time = now.toISOString().substring(11, 16)
    return time;
}

renderMessages() {
    this.messagesContainer.innerHTML = '';
    let template;
    if(this.messages.length > 0) {
        template = this.templateMessages();
    } else {
        template = this.emptyMessages();
    }

    this.messagesContainer.innerHTML = template;
    this.messagesListeners();
    
}

emptyMessages() {
    return '';
}

messagesListeners() {
    if(this.messages.length > 0) {
        this.messagesContainer.querySelectorAll('.message-img').forEach(messageImg => {
            messageImg.addEventListener('click', () => {
                const src = messageImg.getAttribute('src');
                this.overlayService.openChatZoom(src, this.conversationId);
            })
        })
        this.messagesContainer.querySelectorAll('.chat-download-meta').forEach(downloadButton => {
            downloadButton.addEventListener("click", () => {
                const fileName = this.getFilePath(downloadButton);
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
                })
            })
        })
    }
}

templateMessages() {
    const template = this.messages.map(item => `
        <div class="chat-date">${item.date}</div>
        ${item.messages.map(message => `
          ${message.type === 0 ? `
            <div class="message-wrapper ${this.isLastMessage(message.id) ? 'slide-up' : ''} ${message.sent ? 'send' : 'receive'} ${(message.last && message.sent) ? 'sendlast' : ''} ${(message.last && !message.sent) ? 'receivelast' : ''}" style="margin-top: ${message.first ? '6px' : ''}">
              ${message.first ? `
                <div style="font-weight:600;"> ~ ${message.firstName + ' ' + message.lastName}</div>
              ` : ''}
              <div class="text-wrapper">${message.content}</div>
              <div class="message-inf">
                <span>${message.time}</span>
                <div class="check-container" style="display:${message.sent ? 'block' : 'none'}">
                  <i class="material-symbols-outlined check-icon">check</i>
                </div>
              </div>
            </div>
          ` : `
            ${message.files ? message.files.map(file => `
              <div class="message-wrapper message-image-wrapper ${message.sent ? 'chat-img-sent' : 'chat-img-receive'}">
                <div class="chat-img-wrapper ${message.sent ? 'justify-end' : 'justify-start'}">
                  ${message.sent ? `
                  <button class="button button-icon chat-download-meta ${message.sent ? 'left0' : 'right0'}">
                    <i class="material-symbols-outlined">download</i>
                  </button>
                  <img src="/files/${file.path}" width="120" height="80" class="message-img">
                  ` : `
                    <img src="/files/${file.path}" width="120" height="80" class="message-img">
                     <button class="button button-icon chat-download-meta">
                      <i class="material-symbols-outlined">download</i>
                    </button>
                  `}
                </div>
              </div>
            `).join('') : ''}
          `}
        `).join('')}
      `).join('');

      return template;
}

getFilePath(downloadButton) {
    const fullPath = downloadButton.previousElementSibling.getAttribute('src');
    const fileName = fullPath.split('/').pop();
    return fileName;
}

isLastMessage(messageId) {
    const todayMessages = this.messages[this.messages.length - 1].messages;
    const latestMessageId = todayMessages[todayMessages.length - 1].id;
    return (latestMessageId === messageId) && !this.firstOpen ? true : false;
}

handleEnter(ev) {
    if (ev.key === 'Enter') {
        this.addMessage();
    }
}

chatMoreInfo(ev) {
    this.overlayService.openChatInfo(this.chatHeader, this.conversationId, this.chatType);
}

handleLoadingState() {
    if (this.loaded && this.messages.length > 0) {
        this.spinnerContainer.style.display = 'none';
        this.messagesContainer.style.display = 'flex';
        this.chatFlex.style.display = 'flex';
    } else if (this.loaded && this.messages.length === 0) {
        this.spinnerContainer.style.display = 'none';
        this.messagesContainer.style.display = 'none';
        this.chatFlex.style.display = 'none';
    } else {
        this.spinnerContainer.style.display = 'block';
        this.messagesContainer.style.display = 'none';
        this.chatFlex.style.display = 'none';
    }
}

generateMessage(content) {
    const dateUtc = new Date();
    const now = new Date(dateUtc.getTime() - dateUtc.getTimezoneOffset() * 60 * 1000);
    const lm = this.messages[this.messages.length - 1].messages;
    const sent = true;
    const last = true;
    const first = false;
    const time = now.toISOString().substring(11, 16);
    const type = this.images.length > 0 ? 1 : 0;
    const message = { content, sent, last, first, time, type };
    return message
}

detach() { }