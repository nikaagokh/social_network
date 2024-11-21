import axios from "axios";
import { serializeCookies } from "../utils/index.mjs";

export const getIndexView = async (cookies) => {
    const conversationsResponse = await axios.get('http://localhost:3005/api/chat/conversations', {
        headers: {
            Cookie:serializeCookies(cookies)
        }
    });
    const conversations = conversationsResponse.data;
    return conversations;
}

export const getAccountInfoView = async (cookies) => {
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
    const [ sendRequestsResponse, receiveRequestsResponse, contactsResponse, blocksResponse ] = Promise.all(requestPromises);
    const sendRequests = sendRequestsResponse.data;
    const receiveRequests = receiveRequestsResponse.data;
    const contacts = contactsResponse.data;
    const blocks = blocksResponse.data;
    return { sendRequests, receiveRequests, contacts, blocks };
}