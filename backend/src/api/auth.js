const express = require('express') 
const router = express.Router(); 
const authController = require("../controllers/auth.controller")

router.post('/loginAccount', authController.loginAccount);   



module.exports = router;