class SpinnerService {
    constructor() {
        this.globalSpinnerWrapper = null;
        this.globalSpinnerBackdrop = null;
        this.overlayContainer = document.querySelector(".overlay-container");
        this.spinnerTemplate = `<svg class="spinner" width="35px" height="35px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
                                   <circle class="path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle>
                                </svg>`;
    }

    openGlobalSpinner() {
        if (!this.globalSpinnerBackdrop && !this.globalSpinnerWrapper) {
            this.globalSpinnerWrapper = document.createElement("div");
            const spinnerWrapper = document.createElement("div");
            spinnerWrapper.classList.add("spinner-wrapper")
            this.globalSpinnerWrapper.classList.add("overlay-wrapper");
            this.globalSpinnerWrapper.classList.add("overlay-wrapper-dialog")
            this.globalSpinnerBackdrop = document.createElement("div");
            this.globalSpinnerBackdrop.classList.add("dialog-backdrop");
            spinnerWrapper.innerHTML = this.spinnerTemplate;
            this.globalSpinnerWrapper.appendChild(spinnerWrapper);

            this.globalSpinnerBackdrop.addEventListener("click", () => {
                this.overlayContainer.removeChild(this.globalSpinnerBackdrop);
                this.overlayContainer.removeChild(this.globalSpinnerWrapper);
                this.globalSpinnerBackdrop = null;
                this.globalSpinnerWrapper = null;
            })
            this.overlayContainer.appendChild(this.globalSpinnerWrapper);
            this.overlayContainer.appendChild(this.globalSpinnerBackdrop);
        }
    }

    closeGlobalSpinner() {
        if (this.globalSpinnerWrapper && this.globalSpinnerBackdrop) {
            this.overlayContainer.removeChild(this.globalSpinnerBackdrop);
            this.overlayContainer.removeChild(this.globalSpinnerWrapper);
            this.globalSpinnerBackdrop = null;
            this.globalSpinnerWrapper = null;
        }
    }
}

const spinnerService = new SpinnerService();
export default spinnerService;