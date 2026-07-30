const connection = require('../../dbconfig/config')
const hash = require('../middleware/crypto');
const mailController = require('../mailer/mailer.controller');
const { encrypt } = require('crypto-js/aes');
const shared = require('../middleware/shared');
const archiver = require('archiver');

var paths = require("path");
const fs = require('fs');
const mime = require('mime-types');


const add_dtr = async (req, res) => {
    let conn;
    try {
        const data = req.body;
        console.log(data)
        if (!data) { return res.status(400).json({ message: "Missing data" }); }
        const pool = connection.promise();
        conn = await pool.getConnection();
        await conn.beginTransaction();
        // const users = await conn.query(
        //     `SELECT * from employees `,
        // );
        await conn.commit();
        return res.json({ success: true, data: users });
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
}





module.exports = {
    add_dtr,
}