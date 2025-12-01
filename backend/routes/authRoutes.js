const express = require('express');
const { registerStudent, loginStudent, loginProctor, loginAdmin } = require('../controllers/authController');
const router = express.Router();

router.post('/student/register', registerStudent);
router.post('/student/login', loginStudent);
router.post('/proctor/login', loginProctor);
router.post('/admin/login', loginAdmin);

module.exports = router;
