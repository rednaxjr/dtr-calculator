const express = require('express');
const router = express.Router();
const cors = require('cors');
const month_controller = require("../controller/month.controller");

router.post('/get_month', month_controller.get_month);

module.exports = router;