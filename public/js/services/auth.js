import { BehaviorSubject } from "../../utils/behaviorsubject.js";
import lng from "../../utils/language.js";
import cookieService from "./cookies.js";
export const JWT_ACCESS_TOKEN = 'access_token';
export const JWT_REFRESH_TOKEN = 'refresh_token';
class AuthService {
    constructor() {
        this.cookieService = cookieService;
        const token = localStorage.getItem(JWT_ACCESS_TOKEN);
        this.authStateChange = new BehaviorSubject(token ? true : false);
    }

    isAuthed() {
        const token = cookieService.getCookie('access_token');
        return token && !this.tokenExpired(token);
    }
    isAdmin() {
        const token = cookieService.getCookie('access_token');
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const userObj = JSON.parse(jsonPayload);
       
        return userObj.role === 'admin';
    }

    async adminGuard() {
        try {
            return fetch("http://localhost:3001/api/user/admin")
            .then(response => {
                if(!response.ok) {
                    throw new Error('er');
                }
                return true;
            })
        } catch(err) {
            return Promise.resolve(false)
        }
    }

    async register(registerUser) {
        this.lng = lng();
        return fetch(`http://localhost:3001/${this.lng}/api/user/register`, {
            method:"POST",
            headers: {
                "Content-Type": "application/json"
            },
            body:JSON.stringify(registerUser)
        }).then(response => {
            if(!response.ok) {
                throw new Error();
            }
            return response.json();
        })
    }

    async login(email, password) {
        this.lng = lng();
        const login = {email, password};
        return fetch(`http://localhost:3001/${this.lng}/api/user/login`, {
            method:"POST",
            headers: {
                "Content-Type": "application/json"
            },
            body:JSON.stringify(login)
        }).then(response => {
            if(!response.ok) {
                throw new Error("error occured");
            }
            this.authStateChange.next(true);
            return response.json();

        });
    }

    async logout() {
        this.authStateChange.next(false);
    }

    async isAuthenticated() {
        const accessToken = this.cookieService.getCookie('access_token');
        console.log(accessToken);
        if(!accessToken) {
          return Promise.resolve(false);
        }
        
        if(!this.isAuthed()) {
          return this.refreshToken()
          .then(resp => {
            return true;
          })
          .catch(err => {
            return false;
          })
        }
        return Promise.resolve(true);
    }

    async refreshToken() {
        refreshTokenInProgress = true;
        return fetch('/api/user/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refresh: this.getRefreshToken() })
        })
        .then(response => response.json())
        .then(result => {
            this.setAccessToken(result.accesstoken);
            this.authStateChange.next(true)
            refreshTokenInProgress = false;
            return result.accesstoken;
        })
    }

    async verifyUser(pin) {
        return fetch(`/api/user/otp/verify`, {
            method:'POST',
            headers: {
                'Content-Type':'application/json'
            },
            body:JSON.stringify({pin})
        }).then(response => response.json())
        .then(res => {
            console.log(res);
            return res;
        })
    }

    getRefreshToken() {
        return localStorage.getItem(JWT_REFRESH_TOKEN);
    }

    setAccessToken(accessToken) {
        localStorage.setItem(JWT_ACCESS_TOKEN, accessToken);
    }

    setRefreshToken(refreshToken) {
        localStorage.setItem(JWT_REFRESH_TOKEN, refreshToken);
    }

    getAccessToken() {
        const accessToken = localStorage.getItem(JWT_ACCESS_TOKEN);
        return accessToken;
    }

    tokenExpired(token) {
        const expiry = (JSON.parse(atob(token.split('.')[1]))).exp;
        return (Math.floor((new Date).getTime() / 1000)) >= expiry;
    }

    getAuthState() {
        const token = localStorage.getItem(JWT_ACCESS_TOKEN);
        if(token) {
            return new CustomEvent("authstate", {detail:true})
        } else {
            return new CustomEvent("authstate", {detail:false})
        }
    }
}
const authService = new AuthService();
export default authService;