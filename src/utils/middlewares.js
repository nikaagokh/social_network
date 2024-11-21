

export const authenticateJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if(!authorization) {
        return res.status(401).json({message:'გთხოვთ გაიარეთ რეგისტრაცია ან ავტორიზაცია'});
    }

    const token = authorization.split(' ')[1];
    if(!token) {
        return res.status(401).json({message:'გთხოვთ გაიარეთ რეგისტრაცია ან ავტორიზაცია'});
    }
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if(err) {
            return res.status(401).json({message:'გთხოვთ გაიარეთ რეგისტრაცია ან ავტორიზაცია'});
        }
        req.user = decoded.user;
        next();
    })
}

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

export const authenticateUser = (req, res, next) => {
    const userId = Number(req.cookies.userId);
    req.userId = userId;
    next();
}