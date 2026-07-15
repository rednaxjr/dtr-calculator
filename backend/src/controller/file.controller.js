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

const save_dtr = async (req, res) => {
    console.log("save_dtr called");
    try {
        const files = req.files;
        const data = JSON.parse(req.body.data);
        console.log(data)
        const folderPath = paths.join(process.cwd(), 'uploaded_files');


        if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

        const uploadDir = paths.join(process.cwd(), 'uploaded_files/' + data);
        const requestedName = paths.basename(req.body.filename || files[0].originalname || 'DTR.xlsx');
        const safeName = requestedName.replace(/[^a-zA-Z0-9._ -]/g, '_');
        const filePath = paths.join(folderPath, safeName);


        try {
            fs.writeFileSync(filePath, files[0].buffer);
            return res.json({
                success: true,
                name: safeName, 
            });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to save file' });
        }

        return res.status(200).json({ message: 'File uploaded successfully', path: filePath, status: "success" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// const save_dtr = (req, res) => {
//     if (!req.file) {
//         return res.status(400).json({ error: 'No file provided' });
//     }

//     const folderPath = paths.join(process.cwd(), 'uploaded_files');
//     if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

//     // strip any path segments and disallow characters outside a safe filename set
//     const requestedName = paths.basename(req.body.filename || req.file.originalname || 'DTR.xlsx');
//     const safeName = requestedName.replace(/[^a-zA-Z0-9._ -]/g, '_');
//     const filePath = paths.join(folderPath, safeName);

//     try {
//         fs.writeFileSync(filePath, req.file.buffer);
//         return res.json({
//             success: true,
//             name: safeName,
//             url: `${req.protocol}://${req.get('host')}/uploaded_files/${safeName}`,
//         });
//     } catch (err) {
//         console.error(err);
//         return res.status(500).json({ error: 'Failed to save file' });
//     }
// };

module.exports = {
    get_files,
    save_dtr,
}