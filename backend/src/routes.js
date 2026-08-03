var express = require('express');
var router = express.Router();
const file = require("./api/file");
const year = require("./api/year");
const employee = require("./api/employee");
const dtr = require("./api/dtr");
const month = require("./api/month");
const month_data = require("./api/month_data");

router.use('/file', file);
router.use('/year', year);
router.use('/employee', employee);
router.use('/dtr', dtr);
router.use('/month', month);
router.use('/month_data', month_data);


router.use((req, res) => {
  res.status(404).sendFile('./views/404.html', { root: __dirname });
});

module.exports = router;