const connection = require('../../dbconfig/config')
const hash = require('../middleware/crypto');
const mailController = require('../mailer/mailer.controller');
const { encrypt } = require('crypto-js/aes');
const shared = require('../middleware/shared');
const archiver = require('archiver');

var paths = require("path");
const fs = require('fs');
const mime = require('mime-types');


const add_employee = async (req, res) => {
    console.log(req.body);
    let conn;
    try {
        const data = req.body;
        if (!data) {
            return res.status(400).json({ message: "Missing data" });
        }

        const pool = connection.promise();
        conn = await pool.getConnection();
        await conn.beginTransaction(); 
        
        const [existing_user] = await conn.query(
            `SELECT id FROM user WHERE username = ? LIMIT 1`,
            [data.username]
        );

        if (existing_user.length > 0) {
            await conn.rollback();
            return res.status(409).json({
                success: false,
                message: "Username already exists"
            });
        } 
        const birthday = `${data.birth_year}-${String(data.birth_month).padStart(2, '0')}-${String(data.birth_day).padStart(2, '0')} 00:00:00`;

        const [existing_employee] = await conn.query(
            `SELECT id FROM employees 
             WHERE fname = ? AND lname = ? AND birthday = ? 
             LIMIT 1`,
            [data.fname, data.lname, birthday]
        );

        if (existing_employee.length > 0) {
            await conn.rollback();
            return res.status(409).json({
                success: false,
                message: "Employee already exists"
            });
        } 
        const newpassword = hash.encrypt(data.password);

        const user_values = [
            data.username,
            newpassword,
            "3"
        ];

        const [add_user] = await conn.query(
            `INSERT INTO user (username, password, user_role)
             VALUES (?, ?, ?)`,
            user_values
        ); 
        if (add_user.insertId) {
            const employee_values = [
                data.fname,
                data.mname,
                data.lname,
                birthday,
                data.salary,
                data.salary_id,
                data.sss,
                data.pag_ibig,
                data.phil_health,
                add_user.insertId
            ];

            await conn.query(
                `INSERT INTO employees 
                    (fname, mname, lname, birthday, salary, salary_id, sss, pag_ibig, phil_health, user_id, date_created)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                employee_values
            );
        }

        await conn.commit();

        return res.json({
            success: true,
            message: "Employee saved successfully!",
        });

    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Transaction error:", error);

        return res.status(500).json({
            success: false,
            message: "Error saving employee"
        });

    } finally {
        if (conn) conn.release();
    }
};



module.exports = {
    add_employee,
}