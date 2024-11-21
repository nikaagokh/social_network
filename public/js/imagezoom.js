import { url } from "../utils/shared.js";
import httpService from "./services/http.js";
export class ImageZoom {
    constructor(filename, conversationId) {
        this.httpService = httpService;
        this.filename = filename;
        this.conversationId = conversationId;
        this.offset = 1;
        this.close$ = document.createElement("div");
        this.active = 0;
        this.zoom = 1.1;
        this.element = this._createElement();
        this.zoomImg = this.element.querySelector("#zoom-img");
        this.zoomVideo = this.element.querySelector('#zoom-video');
        this.zoomNumber = this.element.querySelector(".zoom-number");
        this.closeButton = this.element.querySelector("#z-closeButton");
        this.downloadButton = this.element.querySelector('#downloadButton');
        this.spinnerContainer = this.element.querySelector('.spinner-container');
        this.imgContainer = this.element.querySelector('.img-container');
        this.zoomDotWrapper = this.element.querySelector('.zoom-dot-wrapper');
        this.leftButton = this.element.querySelector('.left-main');
        this.rightButton = this.element.querySelector('.right-main');
        this.mouseEnter = this.mouseEnter.bind(this);
        this.mouseLeave = this.mouseLeave.bind(this);
        this.mouseMove = this.mouseMove.bind(this);
        this.listeners();
        this.fetchData();
    }

    _createElement() {
        const template = `
        <div class="zoom-container">
        <div class="header-zoom-wrapper">
            <div class="header-zoom">
                <div class="zoom-title">გალერეა</div>
                <div class="zoom-number">
                    ${this.zoom}X
                </div>
                 <div class="header-actions">
                 <button class="button button-icon" id="downloadButton">
                     <i class="material-symbols-outlined">download</i>
                 </button>
                 <button class="turnoff button button-icon" id="z-closeButton">
                     <i class="material-symbols-outlined">close</i>
                 </button>
                 </div>
            </div>
        </div>
        <div class="img-container">
            <img id="zoom-img" class="main-zoom-image">
            <video id="zoom-video" class="main-zoom-video" style="display:none;" controls></video>
            <div class="left left-main">
                <button class="button button-icon">
                    <i class="material-symbols-outlined">keyboard_arrow_left</i>
                </button>
            </div>
            <div class="right right-main">
            <button class="button button-icon">
            <i class="material-symbols-outlined">keyboard_arrow_right</i>
        </button>
            </div>
            <div class="dot-left dot-arrow">
                <i class="material-symbols-outlined">keyboard_arrow_left</i>  
        </div>
        <div class="dot-right dot-arrow"> 
               <i class="material-symbols-outlined">keyboard_arrow_right</i>  
        </div>

        <div class="zoom-dot-container">
        <div class="zoom-dot-wrapper"></div>
        </div>
        
        </div>
         <div class="spinner-container">
         <svg class="spinner" width="35px" height="35px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
             <circle class="path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle>
         </svg>
        </div>
    </div>
        `

        const tempContainer = document.createElement("div");
        tempContainer.innerHTML = template;
        return tempContainer.firstElementChild;
    }

    async fetchData() {
        this.loaded = false;
        this.handleLoadingState();
        //const filesObject = await this.httpService.getFileMessages(this.filename, this.conversationId, this.offset);
        const filesObject = await this.httpService.getMediaFiles(this.conversationId, this.filename, this.offset);
        this.dotFiles = filesObject
        
        this.renderMainFile();
        this.renderDotFiles();
        this.loaded = true;
        this.handleLoadingState();
    }

    renderMainFile() {
        const mainFile = this.dotFiles[this.active];
        if(mainFile.mime.startsWith('image/')) {
            this.zoomImg.setAttribute('src', `${url}/${mainFile.path}`);
            this.zoomImg.style.display = 'block';
            this.zoomVideo.style.display = 'none';
        } else {
            this.zoomVideo.setAttribute('src', `${url}/${mainFile.path}`);
            this.zoomVideo.style.display = 'block';
            this.zoomImg.style.display = 'none';
        }
    }

    renderDotFiles() {
        const template = this.dotFiles.map((file, i) => `
            <div class="zoom-dot-inner ${this.active === i ? 'zoom-dot-active':''}" tabindex="0">
              ${this.getFileTemplate(file)}
            </div>
        `).join('');
        
        this.zoomDotWrapper.innerHTML = template;
        this.zoomDotWrapper.querySelectorAll('.zoom-dot-inner').forEach((dotInner, i) => {
            dotInner.addEventListener('click', () => {
                this.active = i;
                //this.renderDotFiles();
                this.renderMainFile();
                this.updateDotFiles();
            })
        });
        const activatedEl = this.zoomDotWrapper.children.item(this.active);
        activatedEl.focus();
    }

    updateDotFiles() {
        this.zoomDotWrapper.querySelectorAll('.zoom-dot-inner').forEach((dotInner, i) => {
            dotInner.classList.remove('zoom-dot-active');
            if(i === this.active) {
                dotInner.classList.add('zoom-dot-active');
            }
        })
    }

    getFileTemplate(file) {
        const {mime, path} = file;
        if(mime.startsWith('image/')) {
            return `<img src="/files/${path}" class="zoom-dot-image">`;
        } else if(mime.startsWith('video/')) {
            return `
            <i class="material-symbols-outlined chat-preview-play-icon chat-zoom-play-icon">play_circle</i>
            <video src="/files/${path}" width="100" height="75" class="message-zoom-img"></video>`
        } 
    }

    handleLoadingState() {
        console.log(this.loaded)
        if (this.loaded) {
            this.spinnerContainer.style.display = 'none';
            this.imgContainer.style.display = 'flex';
        } else {
            this.spinnerContainer.style.display = 'block';
            this.imgContainer.style.display = 'none';
            console.log(this.spinnerContainer)
        }
    }

    listeners() {
        
        this.zoomImg.addEventListener("mouseenter", this.mouseEnter);
        this.zoomImg.addEventListener("mousemove", this.mouseMove);
        this.zoomImg.addEventListener("mouseleave", this.mouseLeave);
        this.closeButton.addEventListener("click", () => {
            this.close$.dispatchEvent(new CustomEvent('closed'));
        })

        this.downloadButton.addEventListener('click', () => {
            const fileName = this.dotFiles[this.active].path;
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
        
        this.leftButton.addEventListener('click', () => {
            if(this.active > 0) {
                this.active--;
                //this.renderDotFiles();
                this.updateDotFiles();
                this.renderMainFile();
            }
        })

        this.rightButton.addEventListener('click', () => {
            if(this.active < this.dotFiles.length) {
                console.log(this.dotFiles)
                this.active++;
                //this.renderDotFiles();
                this.updateDotFiles();
                this.renderMainFile();

            }
        })

        
    }

    mouseEnter(e) {
        this.zoomImg.addEventListener("wheel", (ev) => {
            ev.preventDefault();
            const wh = (ev.deltaY * -0.001);
            if ((this.zoom > 1.09 && this.zoom < 3.99) || (this.zoom <= 1.09 && wh > 0 || this.zoom >= 3.99 && wh < 0)) {
                this.zoom += wh;
                this.zoomImg.style.setProperty('--zoom', `${this.zoom}`);
                this.zoomNumber.textContent = `${this.zoom.toFixed(1)}X`;
            }

        })
    }

    mouseLeave(e) {
        this.zoomImg.style.setProperty('--x', '50%');
        this.zoomImg.style.setProperty('--y', '50%');
    }

    mouseMove(e) {
        this.zoomImg.style.setProperty('--x', (100 * e.offsetX / this.zoomImg.offsetWidth) + '%');
        this.zoomImg.style.setProperty('--y', (100 * e.offsetY / this.zoomImg.offsetHeight) + '%');
        this.zoomImg.style.setProperty('--zoom', `${this.zoom}`);
    }

    zoomIn() {

    }

    zoomOut() {

    }

    detach() { }
}