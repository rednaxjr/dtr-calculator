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


module.exports = {
    get_year,
}