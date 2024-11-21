import httpService from './services/http.js';
export class ModifyGroup {
    constructor() {
        this.httpService = httpService;
        this.activeSelect = null;
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        this.conversations = JSON.parse(document.querySelector('.modifyGroup-hydration').textContent);
        console.log(this.conversations);
        this.activeSelect = null;
        this.deleteUserIds = []
        this.modifyGroupName = document.querySelector('#modifyGroupName');
        this.allGroupContainer = document.querySelector('#allGroupList');
        this.allGroupButton = document.querySelector('#allGroup');
        this.deleteUserContainer = document.querySelector('#deleteUserList');
        this.deleteUserButton = document.querySelector('#deleteUser');
        this.modifyAdminContainer = document.querySelector('#modifyAdminList');
        this.modifyAdminButton = document.querySelector('#modifyAdmin');
        this.allGroupForm = {
            button: document.querySelector('#allGroup'),
            dropdown: document.querySelector('#allGroupList'),
            isOpen: false,
            active: null,
            placeholder: 'ჯგუფები',
            valueChanges: document.createElement('div')
        };
        this.deleteUserForm = {
            button: document.querySelector('#deleteUser'),
            dropdown: document.querySelector('#deleteUserList'),
            isOpen: false,
            active: null,
            placeholder: 'წაშალე მონაწილე',
            valueChanges: document.createElement('div')
        };
        this.modifyAdminForm = {
            button: document.querySelector('#modifyAdmin'),
            dropdown: document.querySelector('#modifyAdminList'),
            isOpen: false,
            active: null,
            placeholder: 'შეცვალე ადმინი',
            valueChanges: document.createElement('div')
        };

        this.allGroupForm.valueChanges.addEventListener('changed', (ev) => {
            this.conversationId = ev.detail;
            this.conversation = this.conversations.filter(conversation => conversation.id === this.conversationId)[0];
            this.adminId = this.conversation.adminId;
            this.deleteUsers = this.conversation?.users.filter(user => user.id !== this.adminId);
            this.modifyAdmins = this.conversation?.users;
            this.modifyGroupName.value = this.conversation.name;
            this.updateDeleteUsers();
            this.updateModifyAdmins(this.modifyAdmins);
        });

        this.deleteUserForm.valueChanges.addEventListener('changed', (ev) => {
            this.deleteUserIds = ev.detail;
            const modifyAdmins = this.modifyAdmins.filter(user => !this.deleteUserIds.includes(user.id));
            this.updateModifyAdmins(modifyAdmins);
        });

        this.modifyAdminForm.valueChanges.addEventListener('changed', (ev) => {
            this.adminId = ev.detail;
            this.deleteUsers = this.conversation?.users.filter(user => !this.deleteUserIds.includes(user.id) && user.id !== this.adminId);
            this.updateDeleteUsers();
        })

        this.listeners();
    }

    updateDeleteUsers() {
        const deleteUsersTemplate = this.deleteUsers.map(user => `
            <li role="option" class="language-listitem list-item ${this.deleteUserIds.includes(user.id)}" value="${user.id}">
                <span class="checkbox__mark"></span>
                <i class="material-symbols-outlined">person</i>
                <span class="list-item-content" style="align-self: unset;">${user.name} ${this.adminId === user.id ? '(ადმინი)':''}</span>   
            </li>
        `).join('');
        this.deleteUserContainer.innerHTML = deleteUsersTemplate;
    }

    updateModifyAdmins(modifyAdmins) {
        const modifyAdminsTemplate = modifyAdmins.map(user => `
             <li role="option" class="language-listitem list-item ${this.adminId === user.id ? 'active': ''}" value="${user.id}">
                <i class="material-symbols-outlined">person</i>
                <span class="list-item-content" style="align-self: unset;">${user.name}</span>
                <i class="material-symbols-outlined checkbox-mark">done</i>   
            </li>
        `).join('');
        this.modifyAdminContainer.innerHTML = modifyAdminsTemplate;
    }

    updateAdmins() {
        const adminsTemplate = this.inChatUsers.map(user => `
            <li role="option" class="language-listitem list-item" value="${user.id}">
                <i class="material-symbols-outlined">person</i>
                <span class="list-item-content" style="align-self: unset;">${user.name}</span>
                <i class="material-symbols-outlined checkbox-mark">done</i>   
            </li>
        `).join('');

        this.modifyAdminContainer.innerHTML = adminsTemplate;
    }


    listeners() {
        this.allGroupForm.button.addEventListener('click', () => {
            if (!this.activeSelect) {
                this.allGroupForm.isOpen = true;
                this.activeSelect = this.allGroupForm;
                this.activeSelect.dropdown.classList.add('ul-active');
                setTimeout(() => document.addEventListener('click', this.handleOutsideClick))
            } else {
                this.detachList();
            }
        })

        this.deleteUserForm.button.addEventListener('click', () => {
            if (!this.activeSelect) {
                this.deleteUserForm.isOpen = true;
                this.activeSelect = this.deleteUserForm;
                this.activeSelect.dropdown.classList.add('ul-active');
                setTimeout(() => document.addEventListener('click', this.handleOutsideClick))
            } else {
                this.detachList();
            }
        })

        this.modifyAdminForm.button.addEventListener('click', () => {
            if(!this.activeSelect) {
                this.modifyAdminForm.isOpen = true;
                this.activeSelect = this.modifyAdminForm;
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
            if (!multiple) {
                console.log(this.activeSelect)
                const children = this.activeSelect.dropdown.children;
                for (let i = 0; i < children.length; i++) {
                    children[i].classList.remove('active');
                };
                const listItem = ev.target.closest('.list-item');
                listItem.classList.add('active');
                console.log(this.activeSelect)
                this.activeSelect.button.querySelector('.select-value').textContent = listItem.querySelector('.list-item-content').textContent;
                this.activeSelect.active = listItem.value;
                this.activeSelect.valueChanges.dispatchEvent(new CustomEvent('changed', { detail: listItem.value }));
                this.detachList();
            } else {
                let selectedValues = [];
                let selectedRefs = [];
                if (this.activeSelect.active === null) {
                    this.activeSelect.active = [];
                }
                const listItem = ev.target.closest('.list-item');
                listItem.classList.toggle('active');
                //this.activeSelect.active.push(listItem.value);
                Array.from(this.activeSelect.dropdown.children).forEach(li => {
                    if (li.classList.contains('active')) {
                        selectedValues.push(li.querySelector('.list-item-content').textContent);
                        selectedRefs.push(Number(li.getAttribute("value")));
                    }
                })
                if (selectedValues.length !== 0) {
                    this.activeSelect.button.querySelector('.select-value').textContent = selectedValues.join(', ');
                } else {
                    this.activeSelect.button.querySelector('.select-value').textContent = this.activeSelect.placeholder;
                }

                this.activeSelect.valueChanges.dispatchEvent(new CustomEvent('changed', { detail: selectedRefs }));
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