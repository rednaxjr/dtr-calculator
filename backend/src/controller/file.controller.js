const connection = require('../../dbconfig/config')
const hash = require('../middleware/crypto');
const mailController = require('../mailer/mailer.controller');
const { encrypt } = require('crypto-js/aes');
const shared = require('../middleware/shared');
const archiver = require('archiver');

var paths = require("path");
const fs = require('fs');
const mime = require('mime-types');
 
const get_files = (req, res) => {
    const folderPath = paths.join(process.cwd(), 'uploaded_files');
    const digitalSignDir = paths.join(process.cwd(), 'uploaded_files/digital_sign');

    fs.readdir(folderPath, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to read the folder' });
        }

        const pdfFiles = files.filter(file => paths.extname(file).toLowerCase() === '.pdf');

        const fileDetails = pdfFiles.map(file => {
            const filePath = paths.join(folderPath, file);
            const stats = fs.statSync(filePath);
            const mimeType = mime.lookup(file);
            const ftype = shared.detectMimeType(mimeType);
            var d = new Date(stats.mtime);
            time = d.toLocaleString('default', { hour: 'numeric', minute: 'numeric', hour12: true });
            date = d.toLocaleString('default', { year: 'numeric', day: '2-digit', month: 'long' });

            // Get matching folder name (PDF filename without extension)
            const folderName = paths.basename(file, '.pdf');
            const matchingSignDir = paths.join(digitalSignDir, folderName);

            let signatures = [];
            if (fs.existsSync(matchingSignDir)) {
                signatures = fs.readdirSync(matchingSignDir)
                    .filter(f => f.endsWith('.png'))
                    .map(f => ({
                        filename: f,
                        name: f.replace('.png', ''),
                        url: `${req.protocol}://${req.get('host')}/uploaded_files/digital_sign/${folderName}/${f}`,
                        uploadedAt: fs.statSync(paths.join(matchingSignDir, f)).mtime,
                    }));
            }

            return {
                url: `${req.protocol}://${req.get('host')}/uploaded_files/${file}`,
                name: file,
                size: stats.size,
                type: ftype,
                time: time,
                date: date,
                signatureCount: signatures.length,
                signatures: signatures,
            };
        });

        console.log(fileDetails);
        return res.json({
            pdf: fileDetails,
        });
    });
};

 

module.exports = { 
    get_files, 
}