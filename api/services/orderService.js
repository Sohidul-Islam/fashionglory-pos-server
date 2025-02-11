const { Order, OrderItem } = require('../entity');
const sequelize = require('../db');

// Service
const OrderService = {
    async create(orderData, userId) {
        try {
            const order = await Order.create({
                ...orderData,
                UserId: userId
            });
            return { status: true, message: "Order created successfully", data: order };
        } catch (error) {
            return { status: false, message: "Failed to create order", data: null, error };
        }
    },

    async getAll(query = {}, userId) {
        try {
            const whereClause = Object.keys(query).reduce((acc, key) => {
                if (query[key] !== undefined && query[key] !== null && query[key] !== '') {
                    acc[key] = query[key];
                }
                return acc;
            }, { UserId: userId });

            const orders = await Order.findAll({ where: whereClause });
            return { status: true, message: "Orders retrieved successfully", data: orders };
        } catch (error) {
            return { status: false, message: "Failed to retrieve orders", data: null, error };
        }
    },

    async getById(orderId) {
        try {
            const order = await Order.findByPk(orderId, { include: [{ model: OrderItem, as: 'items' }] });
            if (!order) {
                return { status: false, message: 'Order not found', data: null };
            }
            return { status: true, message: 'Order retrieved successfully', data: order };
        } catch (error) {
            return { status: false, message: 'Failed to retrieve order', error };
        }
    },

    async delete(orderId) {
        try {
            const order = await Order.findByPk(orderId);
            if (!order) {
                return { status: false, message: 'Order not found' };
            }
            await order.destroy();
            return { status: true, message: 'Order deleted successfully' };
        } catch (error) {
            return { status: false, message: 'Failed to delete order', error };
        }
    },
};

module.exports = OrderService;
