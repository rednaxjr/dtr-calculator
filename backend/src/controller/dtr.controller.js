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
        const { data, calendar } = req.body;
        console.log(data)
        console.log(calendar)

        if (!Array.isArray(data) || data.length === 0) {
            return res.status(400).json({ success: false, message: "Missing DTR records" });
        }

        if (!calendar || !calendar.year_id || !calendar.month_id) {
            return res.status(400).json({ success: false, message: "Missing calendar data" });
        }

        const year_id = calendar.year_id;
        const month_id = calendar.month_id;
        const days = Array.isArray(calendar.days) ? calendar.days : [];

        const pool = connection.promise();
        conn = await pool.getConnection();
        await conn.beginTransaction(); 
        const [month_rows] = await conn.query(
            `SELECT id FROM month_data WHERE year_id = ? AND month_id = ? LIMIT 1`,
            [year_id, month_id]
        );

        if (month_rows.length === 0) {
            await conn.rollback();
            return res.status(404).json({
                success: false,
                message: "This month has not been set up yet."
            });
        }

        const month_data_id = month_rows[0].id; 
        const dtr_values = data.map(employee => [
            month_data_id,
            employee.id ?? null,
            JSON.stringify(employee.logs ?? []),
            employee.present ?? 0,
            employee.absent ?? 0
        ]);

        const [add_dtr_logs] = await conn.query(
            `INSERT INTO dtr_logs (month_data_id, employee_id, logs, present_count, absent_count)
             VALUES ?`,
            [dtr_values]
        ); 
        await conn.query(
            `UPDATE month_data SET work_days = ?, holidays = ?, days = ? WHERE id = ?`,
            [
                calendar.workday_count ?? 0,
                calendar.holiday_count ?? 0,
                JSON.stringify(days),
                month_data_id
            ]
        );

        await conn.commit();

        return res.json({
            success: true,
            message: "DTR saved successfully!",
            data: {
                year_id,
                month_id,
                month_data_id,
                dtr_saved: add_dtr_logs.affectedRows,
                // records whose name never matched an employee row
                unmatched: data.filter(employee => !employee.id).length,
                total_days: calendar.total_days ?? days.length,
                workday_count: calendar.workday_count ?? 0,
                weekend_count: calendar.weekend_count ?? 0,
                holiday_count: calendar.holiday_count ?? 0
            }
        });
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Transaction error:", error);
        return res.status(500).json({
            success: false,
            message: "Error saving DTR"
        });
    } finally {
        if (conn) conn.release();
    }
}

const get_all_dtr = async (req, res) => {
    let conn;
    try {
        const { data, calendar } = req.body;
        const year_id = calendar.year_id;
        const month_id = calendar.month_id;
        const days = Array.isArray(calendar.days) ? calendar.days : [];


        const pool = connection.promise();
        conn = await pool.getConnection();
        await conn.beginTransaction();
        const [existing] = await conn.query(
            `SELECT * FROM month_data`,
            [year_id, month_id]
        );
        await conn.commit();

    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Transaction error:", error);
        return res.status(500).json({
            success: false,
            message: "Error saving DTR"
        });
    } finally {
        if (conn) conn.release();
    }
}




module.exports = {
    add_dtr,
    get_all_dtr
}