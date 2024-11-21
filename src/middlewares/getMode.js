export const getMode = (req, res, next) => {
    const modeType = req.cookies.mode;
    let mode;
    if(!modeType) {
        mode = 'light';
    } else {
        mode = modeType;
    }
    req.mode = mode;
    res.cookie('mode', mode);
    next();
}