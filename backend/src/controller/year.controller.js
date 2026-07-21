const connection = require('../../dbconfig/config')
const hash = require('../middleware/crypto');
const mailController = require('../mailer/mailer.controller');
const { encrypt } = require('crypto-js/aes');
const shared = require('../middleware/shared');
const archiver = require('archiver');

var paths = require("path");
const fs = require('fs');
const mime = require('mime-types');


const get_year = (req, res) => {
    var query = "SELECT * FROM year";
    connection.query(query, (err, result) => {
        if (err) {
            return res.status(500).json({ message: "SQL error", error: err });
        }
        return res.status(200).json({ data: result });
    });
}

const get_year_month = (req, res) => {
    const data = req.body;
    const query = `
    SELECT 
      m.id,
      m.number,
      m.name,
      COUNT(d.id) AS dtr_count
    FROM month m
    LEFT JOIN dtr_logs d ON d.month_id = m.id
    where m.year_id = ?
    GROUP BY m.id, m.number, m.name
    ORDER BY m.number
  `;

    connection.query(query, [data.id], (err, result) => {
        if (err) return res.status(500).json({ message: "SQL error", error: err });
        return res.status(200).json({ data: result });
    });

    //  LEFT JOIN dtr_logs d ON d.month_id = m.id
    // WHERE m.year_id = ?
    // GROUP BY m.id, m.number, m.name
    // ORDER BY m.number
}



module.exports = {
    get_year,
    get_year_month
}