const express = require('express');
const router = express.Router();
const cors = require('cors');
const month_data_controller = require("../controller/month_data.controller");

router.post('/get_month_data', month_data_controller.get_month_data); 
router.post('/get_all_month_data', month_data_controller.get_all_month_data); 
router.post('/add_month_data', month_data_controller.add_month_data);
router.post('/update_month_data', month_data_controller.update_month_data);
router.post('/get_month_data_by_id', month_data_controller.get_month_data_by_id);
router.post('/get_dtr_logs_by_month_data_id', month_data_controller.get_dtr_logs_by_month_data_id);

module.exports = router;