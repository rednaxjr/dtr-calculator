var express = require('express');
var router = express.Router();
const file = require("./api/file");
const year = require("./api/year");
const employee = require("./api/employee");
const dtr = require("./api/dtr");

router.use('/file', file);
router.use('/year', year);
router.use('/employee', employee);
router.use('/dtr', dtr);


router.use((req, res) => {
  res.status(404).sendFile('./views/404.html', { root: __dirname });
});

module.exports = router;