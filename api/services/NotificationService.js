const { Product, ProductVariant, Color, Size } = require('../entity');
const { Op } = require('sequelize');

const NotificationService = {
    async getStockAlerts(userId) {
        try {
            // Get products with low or out of stock
            const products = await Product.findAll({
                where: {
                    UserId: userId,
                    [Op.or]: [
                        {
                            quantity: { [Op.lte]: sequelize.col('alertQuantity') }
                        },
                        {
                            quantity: 0
                        }
                    ]
                },
                attributes: [
                    'id',
                    'name',
                    'sku',
                    'quantity',
                    'alertQuantity'
                ]
            });

            // Get variants with low or out of stock
            const variants = await ProductVariant.findAll({
                where: {
                    [Op.or]: [
                        {
                            quantity: { [Op.lte]: sequelize.col('alertQuantity') }
                        },
                        {
                            quantity: 0
                        }
                    ]
                },
                include: [
                    {
                        model: Product,
                        where: { UserId: userId },
                        attributes: ['name']
                    },
                    {
                        model: Color,
                        attributes: ['name']
                    },
                    {
                        model: Size,
                        attributes: ['name']
                    }
                ],
                attributes: [
                    'id',
                    'sku',
                    'quantity',
                    'alertQuantity'
                ]
            });

            // Format notifications
            const notifications = [
                // Product notifications
                ...products.map(product => ({
                    type: 'product',
                    id: product.id,
                    name: product.name,
                    sku: product.sku,
                    currentStock: product.quantity,
                    alertQuantity: product.alertQuantity,
                    status: product.quantity === 0 ? 'out_of_stock' : 'low_stock',
                    message: product.quantity === 0
                        ? `${product.name} is out of stock!`
                        : `${product.name} is running low on stock (${product.quantity} remaining)`
                })),

                // Variant notifications
                ...variants.map(variant => ({
                    type: 'variant',
                    id: variant.id,
                    name: `${variant.Product.name} (${variant.Color.name} - ${variant.Size.name})`,
                    sku: variant.sku,
                    currentStock: variant.quantity,
                    alertQuantity: variant.alertQuantity,
                    status: variant.quantity === 0 ? 'out_of_stock' : 'low_stock',
                    message: variant.quantity === 0
                        ? `${variant.Product.name} (${variant.Color.name} - ${variant.Size.name}) is out of stock!`
                        : `${variant.Product.name} (${variant.Color.name} - ${variant.Size.name}) is running low on stock (${variant.quantity} remaining)`
                }))
            ];

            // Sort notifications (out of stock first, then low stock)
            notifications.sort((a, b) => {
                if (a.status === 'out_of_stock' && b.status !== 'out_of_stock') return -1;
                if (a.status !== 'out_of_stock' && b.status === 'out_of_stock') return 1;
                return a.currentStock - b.currentStock;
            });

            // Add summary
            const summary = {
                totalAlerts: notifications.length,
                outOfStock: notifications.filter(n => n.status === 'out_of_stock').length,
                lowStock: notifications.filter(n => n.status === 'low_stock').length
            };

            return {
                status: true,
                message: "Stock alerts retrieved successfully",
                data: {
                    summary,
                    notifications
                }
            };

        } catch (error) {
            return {
                status: false,
                message: "Failed to retrieve stock alerts",
                error: error.message
            };
        }
    },

    async getUnreadNotificationCount(userId) {
        try {
            const { data } = await this.getStockAlerts(userId);
            return {
                status: true,
                data: {
                    count: data.summary.totalAlerts
                }
            };
        } catch (error) {
            return {
                status: false,
                message: "Failed to get notification count",
                error: error.message
            };
        }
    }
};

module.exports = NotificationService; 