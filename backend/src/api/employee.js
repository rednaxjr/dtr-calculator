const express = require('express');
const router = express.Router();
const cors = require('cors');
const employee_controller = require("../controller/employee.controller");
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage });

const corsOptions = {
  origin: ['http://localhost:4200', 'http://localhost:4300'],
  credentials: true
};

router.use(cors(corsOptions));
router.options('*', cors(corsOptions)); 

router.post('/add_employee', employee_controller.add_employee);

module.exports = router;