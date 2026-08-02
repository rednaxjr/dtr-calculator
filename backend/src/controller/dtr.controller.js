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

        const [existing] = await conn.query(
            `SELECT id FROM month_data WHERE year_id = ? AND month_id = ? LIMIT 1`,
            [year_id, month_id]
        );

        if (existing.length > 0) {
            await conn.rollback();
            return res.status(409).json({
                success: false,
                message: "A DTR for this month has already been uploaded."
            });
        }
        const created_at = new Date();

        const month_values = [
            year_id,
            month_id,
            calendar.month_name ?? null,
            calendar.workday_count ?? 0,
            calendar.holiday_count ?? 0,
            created_at,
            JSON.stringify(days)
        ];

        const [insert_month_data] = await conn.query(
            `INSERT INTO month_data (year_id, month_id, name, work_days, holidays, created_at, days)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            month_values
        );



        const dtr_values = data.map(employee => [
            employee.id ?? null,
            JSON.stringify(employee.logs ?? []),
            year_id,
            month_id,
            employee.present,
            employee.absent,
            created_at
        ]);

        const [add_dtr_logs] = await conn.query(
            `INSERT INTO dtr_logs (employee_id, logs, year_id, month_id,present_count, absent_count, created_at)
             VALUES ?`,
            [dtr_values]
        );



        await conn.commit();

        return res.json({
            success: true,
            message: "DTR saved successfully!",
            data: {
                year_id,
                month_id,
                month_data_id: insert_month_data.insertId,
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