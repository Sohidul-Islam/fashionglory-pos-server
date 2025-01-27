const { Order, OrderItem } = require('../entity');
const sequelize = require('../db');

// Service
const OrderService = {
    async create(orderData) {
        try {
            const order = await sequelize.transaction(async (t) => {
                const createdOrder = await Order.create(
                    {
                        orderId: orderData.orderId,
                        date: orderData.date,
                        customerName: orderData.customer.name,
                        customerPhone: orderData.customer.phone,
                        subtotal: orderData.subtotal,
                        tax: orderData.tax,
                        total: orderData.total,
                        paymentMethod: orderData.paymentMethod,
                        verificationCode: orderData.verificationCode,
                        expiryDate: orderData.expiryDate,
                        items: orderData.items,
                    },
                    {
                        transaction: t,
                    }
                );
                return createdOrder;
            });

            return { status: true, message: 'Order created successfully', data: order };
        } catch (error) {
            return { status: false, message: 'Failed to create order', error };
        }
    },

    async getAll() {
        try {
            const orders = await Order.findAll({ include: [{ model: OrderItem, as: 'items' }] });
            return { status: true, message: 'Orders retrieved successfully', data: orders };
        } catch (error) {
            return { status: false, message: 'Failed to retrieve orders', error };
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
