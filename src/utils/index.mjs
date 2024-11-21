import { pool } from "../database/connect.mjs";
import multer from "multer";
import path from "path";
import fs from 'fs';


export const throwError = (message, status) => {
    const error = new Error(message);
    error.status = 400;
    throw error;
}

export const insertRow = async (tableName, object) => {
    const columns = Object.keys(object).join(', ');
    const values = Object.values(object).map(value => pool.escape(value)).join(', ');
    const sql = `INSERT INTO ${tableName} (${columns}) VALUES (${values})`;
    return await pool.query(sql);
}

export const insertRows = async (tableName, filesArray) => {}

export const updateRow = async (tableName, updateObject, whereObject) => {
    const setValues = Object.entries(updateObject).map(([key, value]) => `${key} = ${pool.escape(value)}`).join(', ');
    console.log(setValues)
    const whereValues = Object.entries(whereObject).map(([key, value]) => `${key} = ${pool.escape(value)}`).join(' AND ');
    const sql = `UPDATE ${tableName} SET ${setValues} WHERE ${whereValues}`;   
    return await pool.query(sql);
}

export const updateAndSelect = async (tableName, updateObject, whereObject) => {
    await updateRow(tableName, updateObject, whereObject);
    const id = whereObject.id;
    return await getOne(`select * from ${tableName} where id = ?`, [id]);
}

export const getOne = async (sql, values = []) => {
    const [response] = (await pool.query(sql, values))[0];
    return response;
}

export const getMany = async (sql, values = []) => {
    const [response] = await pool.query(sql, values);
    return response;
}

export const upsertRow = async (tableName, object, whereObject) => {
    const [updateResult] = await updateRow(tableName, object, whereObject);
    if (updateResult.affectedRows === 0) {
        await insertRow(tableName, object);
    }
}

export const deleteRow = async (tableName, whereObject) => {
    const whereValues = Object.entries(whereObject).map(([key, value]) => `${key} = ${pool.escape(value)}`).join(' AND ');
    const sql = `DELETE FROM ${tableName} WHERE ${whereValues}`;
    await pool.query(sql);
}

export const ErrorHandler = (err, req, res, next) => {
    const {message, status} = err;
    res.status(status).json(message);
}

export const serializeCookies = (cookies) => {
    return Object.keys(cookies)
    .map(key => `${key}=${cookies[key]}`)
    .join('; ');
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const fullPath = path.join(process.cwd(), 'files/')
      fs.mkdirSync(fullPath, { recursive: true }); // Ensure the directory exists
      cb(null, fullPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

export const upload = multer({storage:storage});