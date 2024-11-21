import { Contacts } from "./contacts.js";
import { Relations } from "./relations.js";
import { Blocks } from "./blocks.js";
import { AddGroup } from "./add-group.js";
import { ModifyGroup } from "./modify-group.js";

export class Account {

}

function generateJSFile() {
    const path = window.location.pathname.split('/')[2];
    if(path === 'relations') {
        new Relations();
    } else if (path === 'contacts') {
        new Contacts();
    } else if(path === 'blocks') {
        new Blocks();
    } else if(path === 'add-group') {
        new AddGroup();
    } else if(path ==='modify-group') {
        new ModifyGroup();
    }
}
function init() {
    new Account();
    generateJSFile();
}
window.addEventListener('DOMContentLoaded', init);