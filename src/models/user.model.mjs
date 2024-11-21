export class User {
    
    constructor(email='', phone='', password='', firstName='', lastName='', role='user') {
        this.email = email;
        this.phone = phone;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = role;
    }
}