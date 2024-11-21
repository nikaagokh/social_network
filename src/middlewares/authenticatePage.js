export const authenticatePage = (req, res, next) => {
    const token = req.cookies.access_token;
    if (!token) {
        return res.redirect('/login');
    }
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.redirect('/login');
        }
        const user = decoded.user;
        req.user = user;
        req.userId = user.user_id;
        next();
    });
}