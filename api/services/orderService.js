const { Order, OrderItem, Product, ProductVariant, StockHistory } = require('../entity');
const sequelize = require('../db');
const { Op } = require('sequelize');

// Service
const OrderService = {
    async create(orderData, userId) {
        const transaction = await sequelize.transaction();
        try {
            // Generate unique order number
            const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            // Create order
            const order = await Order.create({
                ...orderData,
                orderNumber,
                UserId: userId,
                orderDate: new Date(),
            }, { transaction });

            // Process order items and update stock
            for (const item of orderData.items) {
                const { productId, variantId, quantity, unitPrice } = item;
                const subtotal = quantity * unitPrice;

                // Create order item
                await OrderItem.create({
                    OrderId: order.id,
                    ProductId: productId,
                    ProductVariantId: variantId,
                    quantity,
                    unitPrice,
                    subtotal
                }, { transaction });

                // Update stock
                if (variantId) {
                    const variant = await ProductVariant.findOne({
                        where: { id: variantId },
                        transaction
                    });
                    const previousStock = variant.quantity;
                    const newStock = previousStock - quantity;

                    await variant.update({ quantity: newStock }, { transaction });
                    await StockHistory.create({
                        type: 'order',
                        quantity,
                        previousStock,
                        newStock,
                        ProductId: productId,
                        ProductVariantId: variantId,
                        OrderId: order.id,
                        UserId: userId,
                        note: `Order ${orderNumber}`
                    }, { transaction });
                } else {
                    const product = await Product.findOne({
                        where: { id: productId },
                        transaction
                    });
                    const previousStock = product.quantity;
                    const newStock = previousStock - quantity;

                    await product.update({ quantity: newStock }, { transaction });
                    await StockHistory.create({
                        type: 'order',
                        quantity,
                        previousStock,
                        newStock,
                        ProductId: productId,
                        OrderId: order.id,
                        UserId: userId,
                        note: `Order ${orderNumber}`
                    }, { transaction });
                }
            }

            await transaction.commit();
            return {
                status: true,
                message: "Order created successfully",
                data: order
            };
        } catch (error) {
            await transaction.rollback();
            return {
                status: false,
                message: "Failed to create order",
                error: error.message
            };
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

    async getCustomerOrders(customerId, userId) {
        try {
            const orders = await Order.findAll({
                where: {
                    UserId: userId,
                    customerPhone: customerId
                },
                include: [{
                    model: OrderItem,
                    include: [
                        { model: Product },
                        { model: ProductVariant }
                    ]
                }],
                order: [['orderDate', 'DESC']]
            });

            return {
                status: true,
                message: "Customer orders retrieved successfully",
                data: orders
            };
        } catch (error) {
            return {
                status: false,
                message: "Failed to retrieve customer orders",
                error: error.message
            };
        }
    },

    async getDashboardStats(userId, dateRange) {
        try {
            const whereClause = {
                UserId: userId,
                orderStatus: 'completed'
            };

            if (dateRange) {
                whereClause.orderDate = {
                    [Op.between]: [dateRange.startDate, dateRange.endDate]
                };
            }

            const orders = await Order.findAll({
                where: whereClause,
                include: [{
                    model: OrderItem,
                    include: [
                        {
                            model: Product,
                            attributes: ['costPrice']
                        },
                        {
                            model: ProductVariant,
                            attributes: ['costPrice']
                        }
                    ]
                }]
            });

            // Calculate detailed statistics
            const stats = orders.reduce((acc, order) => {
                acc.totalSales += order.total;
                acc.totalOrders++;
                acc.totalDiscount += order.discount;
                acc.totalTax += order.tax;

                // Calculate profit/loss per item
                order.OrderItems.forEach(item => {
                    const costPrice = item.Product ?
                        item.Product.costPrice :
                        item.ProductVariant.costPrice;
                    const revenue = item.unitPrice * item.quantity;
                    const cost = costPrice * item.quantity;
                    const itemProfit = revenue - cost;

                    if (itemProfit >= 0) {
                        acc.totalProfit += itemProfit;
                    } else {
                        acc.totalLoss += Math.abs(itemProfit);
                    }
                });

                return acc;
            }, {
                totalSales: 0,
                totalOrders: 0,
                totalProfit: 0,
                totalLoss: 0,
                totalDiscount: 0,
                totalTax: 0
            });

            // Add averages and percentages
            stats.averageOrderValue = stats.totalOrders ?
                (stats.totalSales / stats.totalOrders).toFixed(2) : 0;
            stats.profitMargin = stats.totalSales ?
                ((stats.totalProfit / stats.totalSales) * 100).toFixed(2) : 0;
            stats.lossRate = stats.totalSales ?
                ((stats.totalLoss / stats.totalSales) * 100).toFixed(2) : 0;

            return {
                status: true,
                message: "Dashboard stats retrieved successfully",
                data: stats
            };
        } catch (error) {
            return {
                status: false,
                message: "Failed to retrieve dashboard stats",
                error: error.message
            };
        }
    },

    async getSalesReport(userId, query) {
        try {
            const whereClause = {
                UserId: userId,
                orderStatus: 'completed'
            };

            if (query.startDate && query.endDate) {
                whereClause.orderDate = {
                    [Op.between]: [new Date(query.startDate), new Date(query.endDate)]
                };
            }

            const orders = await Order.findAll({
                where: whereClause,
                include: [{
                    model: OrderItem,
                    include: [
                        {
                            model: Product,
                            attributes: ['name', 'sku', 'costPrice']
                        },
                        {
                            model: ProductVariant,
                            attributes: ['sku', 'costPrice']
                        }
                    ]
                }],
                order: [['orderDate', 'DESC']]
            });

            // Process orders for detailed report
            const report = orders.map(order => ({
                orderNumber: order.orderNumber,
                orderDate: order.orderDate,
                customerName: order.customerName,
                customerPhone: order.customerPhone,
                items: order.OrderItems.map(item => ({
                    product: item.Product ? item.Product.name : `Variant: ${item.ProductVariant.sku}`,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    subtotal: item.subtotal,
                    profit: (item.unitPrice - (item.Product ? item.Product.costPrice : item.ProductVariant.costPrice)) * item.quantity
                })),
                subtotal: order.subtotal,
                tax: order.tax,
                discount: order.discount,
                total: order.total,
                paymentMethod: order.paymentMethod,
                paymentStatus: order.paymentStatus
            }));

            return {
                status: true,
                message: "Sales report generated successfully",
                data: report
            };
        } catch (error) {
            return {
                status: false,
                message: "Failed to generate sales report",
                error: error.message
            };
        }
    },

    async generateInvoice(orderId, userId) {
        try {
            const order = await Order.findOne({
                where: {
                    id: orderId,
                    UserId: userId
                },
                include: [{
                    model: OrderItem,
                    include: [
                        {
                            model: Product,
                            attributes: ['name', 'sku']
                        },
                        {
                            model: ProductVariant,
                            include: [
                                { model: Product, attributes: ['name'] },
                                { model: Color, attributes: ['name'] },
                                { model: Size, attributes: ['name'] }
                            ]
                        }
                    ]
                }]
            });

            if (!order) {
                return {
                    status: false,
                    message: "Order not found",
                    error: "Order not found or unauthorized"
                };
            }

            // Format invoice data
            const invoiceData = {
                invoiceNumber: `INV-${order.orderNumber}`,
                date: order.orderDate,
                customer: {
                    name: order.customerName || 'Guest Customer',
                    phone: order.customerPhone || 'N/A',
                    email: order.customerEmail || 'N/A'
                },
                items: order.OrderItems.map(item => {
                    let productName, sku, details;

                    if (item.Product) {
                        productName = item.Product.name;
                        sku = item.Product.sku;
                        details = '';
                    } else if (item.ProductVariant) {
                        productName = item.ProductVariant.Product.name;
                        sku = item.ProductVariant.sku;
                        details = `${item.ProductVariant.Color.name} - ${item.ProductVariant.Size.name}`;
                    }

                    return {
                        productName,
                        sku,
                        details,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        subtotal: item.subtotal
                    };
                }),
                summary: {
                    subtotal: order.subtotal,
                    tax: order.tax,
                    taxRate: (order.tax / order.subtotal * 100).toFixed(2) + '%',
                    discount: order.discount,
                    discountRate: order.discount > 0 ?
                        (order.discount / order.subtotal * 100).toFixed(2) + '%' : '0%',
                    total: order.total
                },
                payment: {
                    method: order.paymentMethod,
                    status: order.paymentStatus
                },
                orderStatus: order.orderStatus,
                businessInfo: {
                    name: "Your Business Name", // You might want to make this configurable
                    address: "Your Business Address",
                    phone: "Your Business Phone",
                    email: "Your Business Email",
                    website: "Your Business Website",
                    taxId: "Your Tax ID"
                }
            };

            // Calculate additional statistics
            const stats = {
                totalItems: order.OrderItems.reduce((sum, item) => sum + item.quantity, 0),
                totalUniqueItems: order.OrderItems.length,
                averageItemPrice: (order.subtotal /
                    order.OrderItems.reduce((sum, item) => sum + item.quantity, 0)).toFixed(2)
            };

            return {
                status: true,
                message: "Invoice generated successfully",
                data: {
                    ...invoiceData,
                    stats
                }
            };

        } catch (error) {
            return {
                status: false,
                message: "Failed to generate invoice",
                error: error.message
            };
        }
    },

    async getTopSellingItems(userId, query = {}) {
        try {
            const whereClause = { UserId: userId };
            if (query.startDate && query.endDate) {
                whereClause.orderDate = {
                    [Op.between]: [new Date(query.startDate), new Date(query.endDate)]
                };
            }

            const orderItems = await OrderItem.findAll({
                include: [
                    {
                        model: Order,
                        where: whereClause,
                        attributes: []
                    },
                    {
                        model: Product,
                        attributes: ['name', 'sku']
                    },
                    {
                        model: ProductVariant,
                        include: [
                            { model: Product, attributes: ['name'] },
                            { model: Color, attributes: ['name'] },
                            { model: Size, attributes: ['name'] }
                        ]
                    }
                ],
                attributes: [
                    [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
                    [sequelize.fn('SUM', sequelize.col('subtotal')), 'totalRevenue'],
                    'ProductId',
                    'ProductVariantId'
                ],
                group: ['ProductId', 'ProductVariantId'],
                order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
                limit: query.limit || 10
            });

            const formattedItems = orderItems.map(item => ({
                productName: item.Product ?
                    item.Product.name :
                    `${item.ProductVariant.Product.name} (${item.ProductVariant.Color.name} - ${item.ProductVariant.Size.name})`,
                sku: item.Product ?
                    item.Product.sku :
                    item.ProductVariant.sku,
                totalQuantity: parseInt(item.dataValues.totalQuantity),
                totalRevenue: parseFloat(item.dataValues.totalRevenue),
                averagePrice: (item.dataValues.totalRevenue / item.dataValues.totalQuantity).toFixed(2)
            }));

            return {
                status: true,
                message: "Top selling items retrieved successfully",
                data: formattedItems
            };
        } catch (error) {
            return {
                status: false,
                message: "Failed to retrieve top selling items",
                error: error.message
            };
        }
    },

    async getTopCustomers(userId, query = {}) {
        try {
            const whereClause = { UserId: userId };
            if (query.startDate && query.endDate) {
                whereClause.orderDate = {
                    [Op.between]: [new Date(query.startDate), new Date(query.endDate)]
                };
            }

            const customers = await Order.findAll({
                where: whereClause,
                attributes: [
                    'customerName',
                    'customerPhone',
                    'customerEmail',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'totalOrders'],
                    [sequelize.fn('SUM', sequelize.col('total')), 'totalSpent']
                ],
                group: ['customerPhone'],
                order: [[sequelize.fn('SUM', sequelize.col('total')), 'DESC']],
                limit: query.limit || 10
            });

            const formattedCustomers = customers.map(customer => ({
                name: customer.customerName || 'Guest Customer',
                phone: customer.customerPhone,
                email: customer.customerEmail || 'N/A',
                totalOrders: parseInt(customer.dataValues.totalOrders),
                totalSpent: parseFloat(customer.dataValues.totalSpent),
                averageOrderValue: (customer.dataValues.totalSpent / customer.dataValues.totalOrders).toFixed(2)
            }));

            return {
                status: true,
                message: "Top customers retrieved successfully",
                data: formattedCustomers
            };
        } catch (error) {
            return {
                status: false,
                message: "Failed to retrieve top customers",
                error: error.message
            };
        }
    }
};

module.exports = OrderService;
