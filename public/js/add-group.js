import httpService from './services/http.js';
export class AddGroup {
    constructor() {
        this.httpService = httpService;
        this.activeSelect = null;
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        this.users = JSON.parse(document.querySelector('.addGroup-hydration').textContent);
        this.addGroupContainer = document.querySelector('#addGroupList');
        this.addGroupName = document.querySelector('#addGroupName');
        this.addAdminContainer = document.querySelector('#addAdminList');
        this.addGroupButton = document.querySelector('#addGroupButton');
        this.addGroupForm = {
            button:document.querySelector('#addGroup'),
            dropdown:document.querySelector('#addGroupList'),
            isOpen:false,
            active:null,
            placeholder:'დაამატეთ ჯგუფი',
            valueChanges:document.createElement('div')
        };
        this.addAdminForm = {
            button:document.querySelector('#addAdmin'),
            dropdown:document.querySelector('#addAdminList'),
            isOpen:false,
            active:null,
            placeholder:'დაამატეთ ადმინი',
            valueChanges:document.createElement('div')
        }

        this.addGroupForm.valueChanges.addEventListener('changed', (ev) => {
            this.userIds= ev.detail;
            if(this.userIds.length > 0) {
                this.inChatUsers = this.users.filter(user => this.userIds.includes(user.id));
                this.updateAdmins();
            }
        });

        this.addAdminForm.valueChanges.addEventListener('changed', (ev) => {
            this.adminId = ev.detail;
        });

        this.addGroupButton.addEventListener('click', () => {
            const groupName = this.addGroupName.value;
            this.httpService.addGroup(this.userIds, this.adminId, groupName).then(s => {
                console.log(s);
            })
        })

        this.listeners();
    }

    updateAdmins() {
        const adminsTemplate = this.inChatUsers.map(user => `
            <li role="option" class="language-listitem list-item" value="${user.id}">
                <i class="material-symbols-outlined">person</i>
                <span class="list-item-content" style="align-self: unset;">${user.name}</span>
                <i class="material-symbols-outlined checkbox-mark">done</i>   
            </li>
        `).join('');

        this.addAdminContainer.innerHTML = adminsTemplate;
    }
    

    listeners() {
        this.addGroupForm.button.addEventListener('click', () => {
            if(!this.activeSelect) {
                this.addGroupForm.isOpen = true;
                this.activeSelect = this.addGroupForm;
                this.activeSelect.dropdown.classList.add('ul-active');
                setTimeout(() => document.addEventListener('click', this.handleOutsideClick))
            } else {
                this.detachList();
            }
        })

        this.addAdminForm.button.addEventListener('click', () => {
            if(!this.activeSelect) {
                this.addAdminForm.isOpen = true;
                this.activeSelect = this.addAdminForm;
                console.log(this.activeSelect)
                this.activeSelect.dropdown.classList.add('ul-active');
                setTimeout(() => document.addEventListener('click', this.handleOutsideClick))
            } else {
                this.detachList();
            }
        })
    }

    handleOutsideClick(ev) {
        const inside = ev.composedPath().some(el => {
            return this.activeSelect.dropdown === el
        });
        if (!inside) {
            this.detachList();
        } else {
            const multiple = Boolean(this.activeSelect.dropdown.getAttribute('aria-multiselectable'));
            if(!multiple) {
                console.log(this.activeSelect)
                const children = this.activeSelect.dropdown.children;
                for(let i = 0; i < children.length; i++) {
                    children[i].classList.remove('active');
                };
                const listItem = ev.target.closest('.list-item');
                listItem.classList.add('active');
                console.log(this.activeSelect)
                this.activeSelect.button.querySelector('.select-value').textContent = listItem.querySelector('.list-item-content').textContent;
                this.activeSelect.active = listItem.value;
                this.activeSelect.valueChanges.dispatchEvent(new CustomEvent('changed', {detail:listItem.value}));
                this.detachList();
            } else {
                let selectedValues = [];
                let selectedRefs = [];
                if(this.activeSelect.active === null) {
                    this.activeSelect.active = [];
                }
                const listItem = ev.target.closest('.list-item');
                listItem.classList.toggle('active');
                //this.activeSelect.active.push(listItem.value);
                Array.from(this.activeSelect.dropdown.children).forEach(li => {
                    if(li.classList.contains('active')) {
                        selectedValues.push(li.querySelector('.list-item-content').textContent);
                        selectedRefs.push(Number(li.getAttribute("value")));
                    }
                })
                if(selectedValues.length !== 0) {
                    this.activeSelect.button.querySelector('.select-value').textContent = selectedValues.join(', ');
                } else {
                    this.activeSelect.button.querySelector('.select-value').textContent = this.activeSelect.placeholder;
                }

                this.activeSelect.valueChanges.dispatchEvent(new CustomEvent('changed', {detail:selectedRefs}));
            }
            
           
        }
    }

    detachList() {
        this.activeSelect.dropdown.classList.remove('ul-active');
        this.activeSelect.isOpen = false;
        this.activeSelect = null;
        document.removeEventListener("click", this.handleOutsideClick);
    }
}