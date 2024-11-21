export class YouSure {
    constructor(text, decline, accept) {
        this.text = text;
        this.accept = accept;
        this.decline = decline;
        this.element = this._createElement();
        this.accept$ = document.createElement('div');
        this.decline$ = document.createElement('div');
        this.acceptButton = this.element.querySelector('#acceptButton');
        this.declineButton = this.element.querySelector('#declineButton');
        this.listeners();
    }

    _createElement() {
        const template = `
        <div class="yousure-container">
        <div class="toaster slide-down toaster-info toaster-no">
            <div class="toaster-message">
                <button class="button button-icon">
                    <i class="material-symbols-outlined toaster-icon">info</i>
                </button>
                <div class="toaster-content">
                    ${this.text}
                </div>
                
            </div>
          </div>
           <div class="yousure-actions">
            <button class="button" id="declineButton">
               ${this.decline}
            </button>
            <button class="button" id="acceptButton">
                ${this.accept}
            </button>
          </div>
    </div>
        `
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = template;
        return tempContainer.firstElementChild;
    }

    listeners() {
        this.acceptButton.addEventListener("click", () => {
            this.accept$.dispatchEvent(new CustomEvent('accepted'));
        })
        this.declineButton.addEventListener("click", () => {
            this.decline$.dispatchEvent(new CustomEvent('declined'));
        })
    }
}