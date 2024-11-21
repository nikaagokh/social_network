class CookieService {
    setCookie(name, value, daysToExpire) {
        var expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + daysToExpire);
    
        var cookieValue = encodeURIComponent(name) + "=" + encodeURIComponent(value) + "; expires=" + expirationDate.toUTCString() + "; path=/";
        document.cookie = cookieValue;
    }
    
    getCookie(name) {
        var cookies = document.cookie.split(';');
        for(var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            if(cookie.indexOf(name + '=') === 0) {
                return decodeURIComponent(cookie.substring(name.length + 1));
            }
        }
        return null;
    }
    
    toggleMode() {
        var currentMode = this.getCookie('mode') || 'light';
        var newMode = currentMode === 'light' ? 'dark' : 'light';

        document.body.classList.remove(currentMode);
        document.body.classList.add(newMode);
    
        this.setCookie('mode', newMode, 30); // Set cookie to expire in 30 days (adjust as needed)
    }

    deleteCookie(name) {
        this.setCookie('access_token', '', -999999);
    }
}

const cookieService = new CookieService();
export default cookieService;