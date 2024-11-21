class ToastService {
    constructor() {
        this.toastTimeoutId = null;
        this.actionStateTimeoutId = null;
        this.toastContainer = document.querySelector(".toast-container");
    }

    showToast(message) {
        console.log(message)
        this.closeToast();
        const toastWrapper = document.createElement("div");
        toastWrapper.classList.add("toast-wrapper");
        const toastLabel = document.createElement("div");
        toastLabel.classList.add("toast-label");
        toastLabel.textContent = message;
        const toastAction = document.createElement("button");
        toastAction.classList.add("button")
        toastAction.classList.add("toast-button");
        toastAction.textContent = 'დახურვა';
        toastWrapper.appendChild(toastLabel)
        toastWrapper.appendChild(toastAction);
        toastAction.addEventListener("click", () => {
            this.closeToast();
        })
        console.log(this.toastContainer)
        console.log(toastWrapper)
        this.toastContainer.appendChild(toastWrapper);

        this.toastTimeoutId = setTimeout(() => {
            this.closeToast();
        }, 3000);
    }

    closeToast() {
        while(this.toastContainer.firstChild) {
            this.toastContainer.removeChild(this.toastContainer.firstChild)
        }
        clearTimeout(this.toastTimeoutId);
    }

    createSuccessToast(message) {
        this.closeToast();
        const template = `
        <div class="toast-welldone slide-down toast-wrapper">
          <div class="toast-message">
            <button class="button button-icon">
              <i class="material-symbols-outlined success">done</i>
            </button>
            <div class="toast-label toast-welldone-content">
                ${message}
            </div>
            <button class="button button-icon toaster-action">
               <i class="material-symbols-outlined success icon-sm">close</i>
            </button>
          </div>
        </div>
        `

        const tempContainer = document.createElement("div");
        tempContainer.innerHTML = template;
        const actionButton = tempContainer.querySelector(".toaster-action");
        actionButton.addEventListener("click", () => {
            this.closeToast();
        })

        this.toastContainer.appendChild(tempContainer.firstElementChild);

        this.toastTimeoutId = setTimeout(() => {
            this.closeToast();
        }, 3000);
    }

    createDangerToast(message) {
        this.closeToast();
        const template = `
        <div class="toast-warning slide-down toast-wrapper">
          <div class="toast-message">
            <button class="button button-icon">
              <i class="material-symbols-outlined warning">warning</i>
            </button>
            <div class="toast-label toast-warning-content">
                ${message}
            </div>
            <button class="button button-icon toaster-action">
               <i class="material-symbols-outlined warning icon-sm">close</i>
            </button>
          </div>
        </div>
        `

        const tempContainer = document.createElement("div");
        tempContainer.innerHTML = template;
        const actionButton = tempContainer.querySelector(".toaster-action");
        actionButton.addEventListener("click", () => {
            this.closeToast();
        })

        this.toastContainer.appendChild(tempContainer.firstElementChild);

        this.toastTimeoutId = setTimeout(() => {
            this.closeToast();
        }, 3000);
    }
}
const toastService = new ToastService();
export default toastService;