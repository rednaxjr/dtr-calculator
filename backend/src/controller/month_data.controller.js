const connection = require('../../dbconfig/config')
const hash = require('../middleware/crypto');
const mailController = require('../mailer/mailer.controller');
const { encrypt } = require('crypto-js/aes');
const shared = require('../middleware/shared');
const archiver = require('archiver');

var paths = require("path");
const fs = require('fs');
const mime = require('mime-types');
const created_at = new Date();



const get_month_data = (req, res) => {
    const data = req.body ?? {};
    console.log("Received data:", data);
    const all_years = !data.year || data.year === 'all';

    const query = `
    SELECT
        md.*, 
        y.name   AS year,
        m.name   AS month,
        m.number AS month_number,
        COUNT(dtr.id) AS logs,
        CASE 
            WHEN COUNT(dtr.id) = 0 THEN NULL
            ELSE JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id',         dtr.id,
                    'logs',       CAST(dtr.logs AS JSON),
                    'created_at', dtr.created_at,
                    'name',       CONCAT(LEFT(emp.lname, 1), '. ', emp.fname),
                    'present',    dtr.present_count
                )
            )
        END AS dtr_logs
        FROM month_data md
        LEFT JOIN year  y ON md.year_id  = y.id
        LEFT JOIN month m ON md.month_id = m.id
        LEFT JOIN dtr_logs dtr ON md.id = dtr.month_data_id
        LEFT JOIN employees emp ON emp.id = dtr.employee_id
        ${all_years ? '' : 'WHERE y.name = ?'}
        GROUP BY md.id, y.name, m.name, m.number
        ORDER BY y.name DESC, m.number DESC
    `;

    const params = all_years ? [] : [data.year];

    connection.query(query, params, (err, result) => {
        const formatted = result.map(row => ({
            ...row,
            dtr_logs: (() => {
                const parsed = typeof row.dtr_logs === 'string'
                    ? JSON.parse(row.dtr_logs)
                    : row.dtr_logs;
                if (!parsed) return null;
                const filtered = parsed.filter(d => d.id !== null);
                return filtered.length > 0 ? filtered : null;
            })()
        }));
        console.log(result)
        if (err) {
            return res.status(500).json({ message: "SQL error", error: err });
        }
        return res.status(200).json({ data: result });
    });
};

const get_all_month_data
    = (req, res) => {
        const data = req.body;
        const query = `
        SELECT
            md.*,
            y.name   AS year,
            m.name   AS month,
            m.number AS month_number,
            COUNT(dtr.id) AS logs
        FROM month_data md
        LEFT JOIN year  y ON md.year_id  = y.id
        LEFT JOIN month m ON md.month_id = m.id
        LEFT JOIN dtr_logs dtr ON md.id = dtr.month_data_id 
        GROUP BY md.id, y.name, m.name, m.number
        ORDER BY y.name DESC, m.number DESC
    `;
        connection.query(query, (err, result) => {
            if (err) {
                return res.status(500).json({ message: "SQL error", error: err });
            }
            return res.status(200).json({ data: result });
        });
    };

const add_month_data = async (req, res) => {
    let conn;
    try {
        const data = req.body;
        if (!data) { return res.status(400).json({ message: "Missing data" }); }


        const pool = connection.promise();
        conn = await pool.getConnection();
        await conn.beginTransaction();

        // one row per period, so refuse a month that is already recorded
        const [existing] = await conn.query(
            `SELECT id FROM month_data WHERE year_id = ? AND month_id = ? LIMIT 1`,
            [data.year_id, data.month_id]
        );

        if (existing.length > 0) {
            await conn.rollback();
            return res.status(409).json({
                success: false,
                message: "This month has already been added."
            });
        }

        const month_values = [
            data.year_id,
            data.month_id,
            data.month_name,
            data.workday_count,
            data.holiday_count,
            new Date(),
            JSON.stringify(data.days)
        ];
        const [insert_month_data] = await conn.query(
            `INSERT INTO month_data (year_id, month_id, name, work_days, holidays, created_at, days)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            month_values
        );
        await conn.commit();
        return res.json({ success: true, data: insert_month_data });
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Transaction error:", error);
        return res.status(500).json({
            success: false,
            message: "Error saving month data"
        });
    } finally {
        if (conn) conn.release();
    }
}



const update_month_data = async (req, res) => {
    let conn;
    try {
        const data = req.body;
        if (!data || !data.id) { return res.status(400).json({ message: "Missing month data id" }); }

        const pool = connection.promise();
        conn = await pool.getConnection();
        await conn.beginTransaction();

        // the period itself is fixed once saved; only the calendar can change
        const [update] = await conn.query(
            `UPDATE month_data
                SET name = ?, work_days = ?, holidays = ?, days = ?
              WHERE id = ?`,
            [
                data.month_name,
                data.workday_count,
                data.holiday_count,
                JSON.stringify(data.days),
                data.id
            ]
        );

        if (update.affectedRows === 0) {
            await conn.rollback();
            return res.status(404).json({ success: false, message: "Month data not found" });
        }

        await conn.commit();
        return res.json({ success: true, data: update });
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Transaction error:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating month data"
        });
    } finally {
        if (conn) conn.release();
    }
}

module.exports = {
    get_month_data,
    get_all_month_data,
    add_month_data,
    update_month_data
}