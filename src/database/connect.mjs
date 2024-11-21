import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();

export const pool = mysql.createPool({
    host:'localhost',
    database:'social_network',
    user:'root',
    password:'',
    port:3306,
    timezone:'Z'
}).promise();
