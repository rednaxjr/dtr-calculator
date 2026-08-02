const express = require('express');
const router = express.Router();
const cors = require('cors');
const dtr_controller = require("../controller/dtr.controller");

router.post('/add_dtr', dtr_controller.add_dtr); 
router.post('/get_all_dtr', dtr_controller.get_all_dtr); 
module.exports = router;