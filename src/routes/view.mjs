import { Router } from "express";
import axios from "axios";
import { getMode } from "../middlewares/getMode.js";
import { authenticatePage } from "../middlewares/authenticatePage.js";
import { GetAccountInfoView, GetIndexView, GetLoginView } from "../controllers/view.mjs";

const router = Router();

router.get('/', getMode, authenticatePage, GetIndexView);

router.get('/login', getMode, GetLoginView);

router.get('/account/info', getMode, authenticatePage, GetAccountInfoView);

router.get('/account/info', (req, res, next) => {
    const requestPromises = [
        axios.get('http://localhost:3005/api/chat/send-requests', {
            headers: {
                Cookie:serializeCookies(req.cookies)
            }
        }),
        axios.get('http://localhost:3005/api/chat/receive-requests', {
            headers: {
                Cookie:serializeCookies(req.cookies)
            }
        }),
        axios.get('http://localhost:3005/api/chat/contact-users', {
            headers: {
                Cookie:serializeCookies(req.cookies)
            }
        }),
        axios.get('http://localhost:3005/api/chat/blocked-users', {
            headers: {
                Cookie:serializeCookies(req.cookies)
            }
        }),
    ];
    Promise.all(requestPromises).then(([v1, v2, v3, v4]) => {
        const sendRequests = v1.data;
        const receiveRequests = v2.data;
        const contacts = v3.data;
        const blocks = v4.data;
        res.render('account', {sendRequests, receiveRequests, contacts, blocks});
    })
})

router.get('/account/about', (req, res, next) => {
    const showAbout = true;
    res.render('account', {showAbout});
})

router.get('/account/password', (req, res, next) => {
    const showPassword = true;
    res.render('account', {showPassword});
})

router.get('/account/contacts', (req, res, next) => {
    axios.get('http://localhost:3005/api/chat/contact-users', {
        headers: {
            Cookie:serializeCookies(req.cookies)
        }
    }).then(response => {
        const contacts = response.data;
        const showContacts = true;
        const JSFile = 'contacts';
        res.render('account', {contacts, showContacts, JSFile})
    })
})

router.get('/account/relations', (req, res, next) => {
    const requestPromises = [
        axios.get('http://localhost:3005/api/chat/send-requests', {
            headers: {
                Cookie:serializeCookies(req.cookies)
            }
        }),
        axios.get('http://localhost:3005/api/chat/receive-requests', {
            headers: {
                Cookie:serializeCookies(req.cookies)
            }
        })
    ];

    Promise.all(requestPromises).then(([v1, v2]) => {
        const sendRequests = v1.data;
        const receiveRequests = v2.data;
        const showRelations = true;
        const JSFile = 'relations';
        res.render('account', {sendRequests, receiveRequests, showRelations, JSFile});
    });
})

router.get('/account/blocks', (req, res, next) => {
    axios.get('http://localhost:3005/api/chat/blocked-users', {
        headers: {
            Cookie:serializeCookies(req.cookies)
        }
    }).then(response => {
        const blocks = response.data;
        const showBlocks = true;
        const JSFile = 'blocks';
        res.render('account', {blocks, showBlocks, JSFile})
    })
})

router.get('/admin/about', (req, res, next) => {
    const showAbout = true;
    res.render('admin', {showAbout});
})

router.get('/admin/password', (req, res, next) => {
    const showPassword = true;
    res.render('admin', {showPassword});
})

router.get('/admin/contacts', (req, res, next) => {
    axios.get('http://localhost:3005/api/chat/contact-users', {
        headers: {
            Cookie:serializeCookies(req.cookies)
        }
    }).then(response => {
        const contacts = response.data;
        const showContacts = true;
        const JSFile = 'contacts';
        res.render('admin', {contacts, showContacts, JSFile})
    })
})

router.get('/admin/relations', (req, res, next) => {
    const requestPromises = [
        axios.get('http://localhost:3005/api/chat/send-requests', {
            headers: {
                Cookie:serializeCookies(req.cookies)
            }
        }),
        axios.get('http://localhost:3005/api/chat/receive-requests', {
            headers: {
                Cookie:serializeCookies(req.cookies)
            }
        })
    ];

    Promise.all(requestPromises).then(([v1, v2]) => {
        const sendRequests = v1.data;
        const receiveRequests = v2.data;
        const showRelations = true;
        const JSFile = 'relations';
        res.render('admin', {sendRequests, receiveRequests, showRelations, JSFile});
    });
})

router.get('/admin/blocks', (req, res, next) => {
    axios.get('http://localhost:3005/api/chat/blocked-users', {
        headers: {
            Cookie:serializeCookies(req.cookies)
        }
    }).then(response => {
        const blocks = response.data;
        const showBlocks = true;
        const JSFile = 'blocks';
        res.render('admin', {blocks, showBlocks, JSFile})
    })
})

router.get('/admin/add-group', (req, res, next) => {
    axios.get('http://localhost:3005/api/chat/users', {
        headers: {
            Cookie:serializeCookies(req.cookies)
        }
    }).then(response => {
        const users = response.data;
        const showGroupAdd = true;
        const hydration = JSON.stringify(users);
        res.render('admin', {users, showGroupAdd, hydration});
    })
})

router.get('/admin/modify-group', (req, res, next) => {
    const requestPromises = [
        axios.get('http://localhost:3005/api/chat/admin/conversations', {
            headers: {
                Cookie:serializeCookies(req.cookies)
            }
        })
    ];
    Promise.all(requestPromises).then(([v1]) => {
        const conversations = v1.data;
        const showGroupModify = true;
        const hydration = JSON.stringify(conversations);
        res.render('admin', {conversations, showGroupModify, hydration});
        
    })
})

router.get('/files', (req, res, next) => {
    
    //const files = [{date:'16.07', files:[{FILE_ID:1, NAME:'ragaca da faili', EXTENSION:'zip'}, {FILE_ID:2, NAME:'ragacaa da faili', EXTENSION:'folder'}]}, {date:'18.07', files:[{FILE_ID:3, NAME:'ragaca da faili', EXTENSION:'zip'}, {FILE_ID:4, NAME:'ragacaa da faili', EXTENSION:'folder'}]}];
    axios.get('http://localhost:3005/api/chat/conversations', {
        headers: {
            Cookie:serializeCookies(req.cookies)
        }
    }).then(response => {
        const conversations = response.data;
        console.log(conversations[2].conversations)
        res.render('files', {conversations});
    })
    
})

function serializeCookies(cookies) {
    return Object.keys(cookies)
    .map(key => `${key}=${cookies[key]}`)
    .join('; ');
}

export default router;