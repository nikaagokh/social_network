<div class="message-wrapper message-image-wrapper ${message.sent ? 'chat-img-sent' : 'chat-img-receive'}">
          <div class="chat-img-wrapper ${message.sent ? 'justify-end' : 'justify-start'}">
            ${message.sent ? `
            <button class="button button-icon chat-download-meta ${message.sent ? 'left0' : 'right0'}">
              <i class="material-symbols-outlined">download</i>
            </button>
            <img src="/files/${file.path}" width="150" height="100" class="message-img">
            ` : `
              <img src="/files/${file.path}" width="150" height="100" class="message-img">
               <button class="button button-icon chat-download-meta">
                <i class="material-symbols-outlined">download</i>
              </button>
            `}
          </div>
        </div>