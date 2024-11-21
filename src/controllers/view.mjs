import { getAccountInfoView, getIndexView } from "../handlers/view.mjs";

export const GetIndexView = async (req, res, next) => {
    const conversations = await getIndexView(req.cookies);
    res.render('index', {conversations})
} 

export const GetLoginView = async (req, res, next) => {
    res.render('login');
}

export const GetAccountInfoView = async (req, res, next) => {
    const { sendRequests, receiveRequests, contacts, blocks } = await getAccountInfoView(req.cookies);
    res.render('account', {sendRequests, receiveRequests, contacts, blocks});
}