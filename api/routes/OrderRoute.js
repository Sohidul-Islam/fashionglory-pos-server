const express = require('express');
const { OrderService, AuthService } = require('../services');


// Router
const router = express.Router();

router.post('/', AuthService.authenticate, async (req, res) => {
    const UserId = req?.user?.id || null;
    const result = await OrderService.create({ ...req.body, UserId });
    res.status(result.status ? 201 : 400).json(result);
});

router.get('/', AuthService.authenticate, async (req, res) => {
    const result = await OrderService.getAll();
    res.status(result.status ? 200 : 400).json(result);
});

router.get('/:orderId', async (req, res) => {
    const result = await OrderService.getById(req.params.orderId);
    res.status(result.status ? 200 : 404).json(result);
});

router.delete('/:orderId', async (req, res) => {
    const result = await OrderService.delete(req.params.orderId);
    res.status(result.status ? 200 : 404).json(result);
});

module.exports = router;