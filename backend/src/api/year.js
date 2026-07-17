const express = require('express');
const router = express.Router();
const cors = require('cors');
const year_controller = require("../controller/year.controller");

router.post('/get_year', year_controller.get_year);


module.exports = router;