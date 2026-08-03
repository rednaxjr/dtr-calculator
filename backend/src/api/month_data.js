const express = require('express');
const router = express.Router();
const cors = require('cors');
const month_data_controller = require("../controller/month_data.controller");

router.post('/get_month_data', month_data_controller.get_month_data); 
router.post('/get_all_month_data', month_data_controller.get_all_month_data); 
router.post('/add_month_data', month_data_controller.add_month_data); 
module.exports = router;