import socketService from "./services/socket.js";
import cookieService from "./services/cookies.js";
export class AdminChat {

  constructor() {
    this.socketService = socketService;
    this.mode = cookieService.getCookie('mode');
    this.close$ = document.createElement('div');
    this.loaded = false;
    this.active = 0;
    this.element = this._createElement();
    this.messagesContainer = this.element.querySelector("#messagesContainer");
    this.spinnerContainer = this.element.querySelector('.chat-spinner');
    this.chatFlex = this.element.querySelector('.chat-flex');
    this.conversationContainer = this.element.querySelector('.adminchat-list');
    this.sendButton = this.element.querySelector('#messageSend');
    this.messageInput = this.element.querySelector('#messageInput');
    this.handleEnter = this.handleEnter.bind(this);
    this.addMessage = this.addMessage.bind(this);
    this.handleOutsideClick = this.handleOutsideClick.bind(this);

    this.listeners();
    this.fetchData();
    
    /*
    const conversations = [
      {id:3412, person:'ნიკა გოხაძე', sent:true, message:'?', date:'26.06', time:'6:41', chat:[{date:'26.06', messages:[{send:false,last:false, time:'6:39', content:'gamarjoba'}, {send:false,last:false, time:'6:39', content:'bmws ablicovka ragirs?'}, {send:true,last:false, time:'6:41', content:'romeli bmw'} ,{send:true,last:false, time:'6:41', content:'?'}]}]},
      {id:4444, person:'გელა გნოლიძე', sent:false, message:'ragirs?', date:'25.06', time:'5:30', chat:[{date:'25.06', messages:[{send:false, last:true, time:'5:30', content:'ragirs?'}]}]}
    ];
    localStorage.setItem('conversations', JSON.stringify(conversations));
    */
  }

  listeners() {
    this.sendButton.addEventListener("click", this.addMessage);
    document.addEventListener("keydown", this.handleEnter);
    setTimeout(() => {
      document.addEventListener("click", this.handleOutsideClick);
    }, 0);

  }

  fetchData() {
    this.loaded = false;
    this.handleLoadingState();
    this.renderConversations();
    this.renderMessages();
    this.loaded = true;
    this.handleLoadingState();
    /*
    setTimeout(() => {
      this.scrollBottom();
    }, 0);
    */
  }

  getLocalConversations() {
    const conversations = localStorage.getItem('conversations');
    if (conversations) {
      return JSON.parse(conversations);
    } else {
      return []
    }
  }

  getLocalMessages(index = 0) {
    const conversations = localStorage.getItem('conversations');

    if (conversations) {
      let objectArray = JSON.parse(conversations);
      let foundMessages = [];

      const foundObject = objectArray[index];
      console.log(foundObject);
      if (foundObject) {
        foundMessages = foundObject.chat;
      }
      return foundMessages;
    } else {
      return [];
    }
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

  scrollBottom() {
    const chatWrapper = this.element.querySelector('.adminchat-chatwrapper');
    const top = chatWrapper.scrollHeight;
    chatWrapper.scrollTo({
      top: top,
      behavior: 'smooth'
    })
  }

  handleEnter(ev) {
    if (ev.key === 'Enter') {
      this.addMessage();
    }
  }

  _createElement() {
    const template = `
                <div class="adminchat-container">
    <div class="adminchat-messages">
        <div class="adminchat-list"></div>
    </div>
    <div class="adminchat-chat">
        <div class="adminchat-chatwrapper ${this.mode === 'light' ? 'chat-background' :''}">
            <div class="chat-flex">
                <div class="intersecting" id="intersecting"></div>
                <div class="message-container" id="messagesContainer"></div>
            </div>
        </div>
        <div class="adminchat-footer">
            <input type="text" id="messageInput" placeholder="" class="chat-input">
            <button class="button button-icon" id="messageSend">
                <i id="sendMessageBtn" class="material-symbols-outlined send-message-icon">send</i>
            </button>
        </div>
    </div>
    <div class="chat-spinner">
        <svg class="spinner" width="35px" height="35px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
            <circle class="path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle>
        </svg>
    </div>
</div>
        `;
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = template;
    return tempContainer.firstElementChild;
  }

  clearInput() {
    this.messageInput.value = '';
  }

  renderConversations() {
    this.conversationContainer.innerHTML = '';
    this.conversations = this.getLocalConversations();
    const template = `
           ${this.conversations?.map((conversation, i) => `
            <div class="list-item adminchat-listitem list-divider ${this.active === i ? 'active':''}" data-id=${conversation.id}>
                <i class="material-symbols-outlined adminchat-icon">account_circle</i>
                <span class="list-item-content">
                    <h4 class="list-item-title">
                        ${conversation.person}
                    </h4>
                    <p class="list-item-line">
                        ${conversation.sent ? 'თქვენ' : 'ის'}: ${conversation.message}
                    </p>
                </span>
                <div class="list-item-meta">
                    <span class="adminchat-date">${conversation.date}</span>
                    <span class="adminchat-time">${conversation.time}</span>
                </div>
            </div>
            `).join('')}
    `;
    this.conversationContainer.innerHTML = template;
    this.conversationContainer.querySelectorAll('.list-item').forEach((listItem, i) => {
     listItem.addEventListener("click", (ev) => {
      this.active = i;
      this.renderMessages();
      this.activeConversation();
     })
    })
  }

  activeConversation() {
    const children = this.conversationContainer.children;
    for(let i = 0; i < children.length; i++) {
      children[i].classList.remove('active');
      console.log(children[i]);
    }
    children[this.active].classList.add('active');
  }

  renderMessages() {
    this.messagesContainer.innerHTML = '';
    this.messages = this.getLocalMessages(this.active);
    const template = `
          ${this.messages.map(item => `
             <div class="chat-date">${item.date}</div>
             ${item.messages.map(message => `
                 <div class="message-wrapper slide-up ${message.send ? 'send' : 'receive'} ${(message.last && message.send) ? 'sendlast' : ''} ${(message.last && !message.send) ? 'receivelast' : ''}">
                    <div class="text-wrapper">${message?.content}</div>
                    <div class="message-inf">
                        <span>${message?.time}</span>
                        <div class="check-container">
                            ${message.sent ? `
                                 <i class="material-symbols-outlined check-icon">check</i>
                                
                            ` : ``}
                        </div>
                    </div>
                </div>
             `).join('')}
            `).join('')}
        `;

    this.messagesContainer.innerHTML = template;
  }

  addMessage() {
    const content = this.messageInput.value;
    const date = this.formatDate();
    const time = this.getTime();
    const send = true;
    const last = true;
    const messages = this.getLocalMessages(this.active);
    const index = this.getIndexOf(date, messages);
    const messageObject = {content, time, send, last};
    if(index === -1) {
        const object = {
            date:date,
            messages: []
        };
        object.messages.push(messageObject);
        messages.push(object);
        
    } else {
        messages[index].messages.push(messageObject);
        console.log(messages)
    };
    this.conversations[this.active].chat = messages;
    this.addLocalConversation();
    this.renderMessages();
    this.clearInput();
    this.scrollBottom();
    this.updateConversationObject(messageObject);
    
  }

  updateConversationObject(messageObject) {
    this.conversations[this.active].sent = messageObject.send;
    this.conversations[this.active].time = messageObject.time;
    const children = this.conversationContainer.children;
    const listItem = children[this.active];
    const itemLine = listItem.querySelector('.list-item-line');
    const itemTime = listItem.querySelector('.adminchat-time');
    itemLine.textContent = `${this.conversations[this.active].sent ? 'თქვენ' : 'ის'}: ${this.conversations[this.active].message}`;
    itemTime.textContent = this.conversations[this.active].time;
  }

  handleOutsideClick(ev) {
    const inside = ev.composedPath().some(el => {
        return this.element === el
    });
    if (!inside) {
        this.detach();
    };
}

  addLocalConversation() {
    localStorage.setItem('conversations', JSON.stringify(this.conversations));
  }

  getTime() {
    const dateUtc = new Date();
    const now = new Date(dateUtc.getTime() - dateUtc.getTimezoneOffset() * 60 * 1000);
    const time = now.toISOString().substring(11,16)
    return time;
}

formatDate() {
    const date = new Date();
    const day = date.getDate().toString().padStart(2, '0'); // Get day and pad with leading zero if necessary
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Get month (months are zero-indexed) and pad with leading zero if necessary
    return `${day}.${month}`;
}
getIndexOf(date, messages) {
  const index = messages.findIndex(obj => obj.date === date);
  return index;
}

detach() {
  document.removeEventListener('keyup', this.handleEnter);
  document.removeEventListener('click', this.handleOutsideClick);
  this.close$.dispatchEvent(new CustomEvent('closed'));
}
}