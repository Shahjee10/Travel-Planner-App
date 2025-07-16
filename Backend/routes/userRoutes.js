const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/register/send-otp', userController.sendOtpForSignup);
router.post('/register/resend-otp', userController.resendOtpForSignup);
router.post('/register/verify-otp', userController.verifyOtpAndRegister);

router.post('/login', userController.loginUser);

router.post('/reset/send-otp', userController.sendOtpForReset);
router.post('/reset/verify-otp', userController.resetPasswordWithOtp);

module.exports = router;
