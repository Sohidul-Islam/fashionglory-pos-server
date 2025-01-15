const express = require('express');
const { AuthService } = require('../services');
const requestHandler = require('../utils/requestHandler');


const router = express.Router();

router.post('/register', requestHandler(null, async (req, res) => {
    const result = await AuthService.register(req.body);
    res.status(result.status).json(result.data);
}));

router.post('/login', requestHandler(null, async (req, res) => {
    const result = await AuthService.login(req.body.email, req.body.password);
    res.status(result.status).json(result.data);
}));

router.get('/profile', AuthService.authenticate, requestHandler(null, async (req, res) => {
    const email = req.query.email;
    const result = await AuthService.getProfile(email);
    res.status(result.status).json(result.data);
}));

router.post('/profile', AuthService.authenticate, requestHandler(null, async (req, res) => {
    const userId = req.user.id; // Assuming user ID is available in req.user
    const result = await AuthService.updateProfile(userId, req.body);
    res.status(result.status).json(result.data);
}));

router.post('/reset-password', AuthService.authenticate, requestHandler(null, async (req, res) => {
    const result = await AuthService.resetPassword(req.body.email, req.body.newPassword);
    res.status(result.status).json(result.data);
}));

module.exports = router; 