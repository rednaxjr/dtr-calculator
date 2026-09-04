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
    const all_years = !data.year || data.year === 'all';

    const query = `
        SELECT
            md.*,
            md.work_days AS workdays,
            y.name   AS year,
            m.name   AS month,
            m.number AS month_number,
            COUNT(dtr.id) AS logs
        FROM month_data md
        LEFT JOIN year  y ON md.year_id  = y.id
        LEFT JOIN month m ON md.month_id = m.id
        LEFT JOIN dtr_logs dtr ON md.id = dtr.month_data_id
        ${all_years ? '' : 'WHERE y.name = ?'}
        GROUP BY md.id, y.name, m.name, m.number
        ORDER BY y.name DESC, m.number DESC
    `;

    const params = all_years ? [] : [data.year];

    connection.query(query, params, (err, result) => {
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
        if (!data || !data.month_id) { return res.status(400).json({ message: "Missing month data id" }); }

        const pool = connection.promise();
        conn = await pool.getConnection();
        await conn.beginTransaction();

        const [update] = await conn.query(
            `UPDATE month_data
                SET name = ?, work_days = ?, holidays = ?, days = ?
              WHERE month_id = ?`,
            [
                data.month_name,
                data.workday_count,
                data.holiday_count,
                JSON.stringify(data.days),
                data.month_id
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
const get_month_data_by_id = async (req, res) => {
    const data = req.body;
    if (!data) { return res.status(400).json({ message: "Missing data" }); }
    const query = `SELECT md.* ,y.name as year_name, m.name as month_name, m.number as month_number FROM 
    month_data md, year y, month m WHERE 
    md.month_id = ? AND md.year_id = y.id AND md.month_id = m.id LIMIT 1`;


    connection.query(query, [data.id], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "SQL error", error: err });
        }
        return res.status(200).json({ data: result[0] });
    });
}

const get_dtr_logs_by_month_data_id = async (req, res) => {
    const data = req.body;
    if (!data) { return res.status(400).json({ message: "Missing data" }); }
    // the table only stores employee_id, so pull the name in for the listing
    const query = `
        SELECT
            dtr.*,
            COALESCE(CONCAT(e.lname, ', ', e.fname), 'Unmatched') AS name,
            dtr.present_count AS present,
            dtr.absent_count  AS absent
        FROM dtr_logs dtr
        LEFT JOIN employees e ON dtr.employee_id = e.id
        WHERE dtr.month_data_id = ?
        ORDER BY e.lname, e.fname
    `;

    connection.query(query, [data.id], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "SQL error", error: err });
        }
        return res.status(200).json({ data: result });
    });

}


// const get_month_data_by_id = async (req, res) => {

//     let conn;
//     try {
//         const data = req.body;
//         if (!data) { return res.status(400).json({ message: "Missing data" }); }


//         const pool = connection.promise();
//         conn = await pool.getConnection();
//         await conn.beginTransaction();

//         const [query] = await conn.query(
//             `SELECT * FROM month_data WHERE month_id = ? LIMIT 1`,
//             [data.id]
//         );

//         connection.query(query, (err, result) => {
//             if (err) {
//                 return res.status(500).json({ message: "SQL error", error: err });
//             }


//         });

//         await conn.commit();
//         return res.json({ success: true, data: query });
//     } catch (error) {
//         if (conn) await conn.rollback();
//         console.error("Transaction error:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Error updating month data"
//         });
//     } finally {
//         if (conn) conn.release();
//     }
// }
module.exports = {
    get_month_data,
    get_all_month_data,
    add_month_data,
    update_month_data,
    get_month_data_by_id,
    get_dtr_logs_by_month_data_id
}