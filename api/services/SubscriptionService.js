const { SubscriptionPlan, UserSubscription, Coupon } = require('../entity');
const { Op } = require('sequelize');
const CouponService = require('./CouponService');
const { User } = require('../entity');
const path = require('path');
const fs = require('fs');

const SubscriptionService = {
    async createPlan(planData) {
        try {
            const plan = await SubscriptionPlan.create(planData);
            return {
                status: true,
                message: "Subscription plan created successfully",
                data: plan
            };
        } catch (error) {
            return {
                status: false,
                message: "Failed to create subscription plan",
                error: error.message
            };
        }
    },

    async getAllPlans(query = {}) {
        try {
            const whereClause = {};
            if (query.status) whereClause.status = query.status;

            const plans = await SubscriptionPlan.findAll({
                where: whereClause,
                order: [['price', 'ASC']]
            });
            return {
                status: true,
                message: "Subscription plans retrieved successfully",
                data: plans
            };
        } catch (error) {
            return {
                status: false,
                message: "Failed to retrieve subscription plans",
                error: error.message
            };
        }
    },

    async getPlanById(id) {
        try {
            const plan = await SubscriptionPlan.findByPk(id);
            if (!plan) {
                return {
                    status: false,
                    message: "Subscription plan not found",
                    data: null
                };
            }
            return {
                status: true,
                message: "Subscription plan retrieved successfully",
                data: plan
            };
        } catch (error) {
            return {
                status: false,
                message: "Failed to retrieve subscription plan",
                error: error.message
            };
        }
    },

    async updatePlan(id, updateData) {
        try {
            const plan = await SubscriptionPlan.findByPk(id);
            if (!plan) {
                return {
                    status: false,
                    message: "Subscription plan not found",
                    data: null
                };
            }
            await plan.update(updateData);
            return {
                status: true,
                message: "Subscription plan updated successfully",
                data: plan
            };
        } catch (error) {
            return {
                status: false,
                message: "Failed to update subscription plan",
                error: error.message
            };
        }
    },

    async subscribeToPlan(userId, subscriptionData) {
        try {
            const plan = await SubscriptionPlan.findByPk(subscriptionData.planId);
            if (!plan) {
                return {
                    status: false,
                    message: "Subscription plan not found",
                    data: null
                };
            }

            // Cancel all active subscriptions for this user
            await UserSubscription.update(
                { status: "cancelled" },
                {
                    where: {
                        UserId: userId,
                        status: "active"
                    }
                }
            );

            let discountAmount = 0;
            let couponCode = null;

            // Validate coupon if provided
            if (subscriptionData.couponCode) {
                const couponValidation = await CouponService.validateCoupon(
                    subscriptionData.couponCode,
                    plan.price
                );

                if (couponValidation.status) {
                    discountAmount = couponValidation.data.discountAmount;
                    couponCode = subscriptionData.couponCode;

                    // Increment coupon usage
                    await Coupon.increment('usedCount', {
                        where: { code: couponCode }
                    });
                } else {
                    return couponValidation; // Return coupon validation error
                }
            }

            // Calculate end date based on plan duration
            const startDate = new Date();
            const endDate = new Date(startDate.getTime() + plan.duration * 30 * 24 * 60 * 60 * 1000);

            const subscription = await UserSubscription.create({
                UserId: userId,
                SubscriptionPlanId: plan.id,
                startDate,
                endDate,
                amount: plan.price,
                discount: discountAmount,
                coupon: couponCode,
                paymentMethod: subscriptionData.paymentMethod,
                paymentStatus: subscriptionData.paymentStatus || 'pending'
            });

            return {
                status: true,
                message: "Successfully subscribed to plan",
                data: {
                    ...subscription.toJSON(),
                    originalPrice: plan.price,
                    discountAmount,
                    finalAmount: plan.price - discountAmount
                }
            };
        } catch (error) {
            return {
                status: false,
                message: "Failed to subscribe to plan",
                error: error.message
            };
        }
    },

    async getUserSubscription(userId) {
        try {
            const subscription = await UserSubscription.findOne({
                where: {
                    UserId: userId,
                    status: 'active',
                    endDate: {
                        [Op.gt]: new Date()
                    }
                },
                include: [{
                    model: SubscriptionPlan,
                    attributes: ['name', 'features', 'maxProducts', 'maxUsers']
                }],
                order: [['endDate', 'DESC']]
            });

            return {
                status: true,
                message: "User subscription retrieved successfully",
                data: subscription
            };
        } catch (error) {
            return {
                status: false,
                message: "Failed to retrieve user subscription",
                error: error.message
            };
        }
    },

    async deletePlan(id) {
        try {
            // Check if plan exists
            const plan = await SubscriptionPlan.findByPk(id);
            if (!plan) {
                return {
                    status: false,
                    message: "Subscription plan not found",
                    data: null
                };
            }

            // Check if plan has active subscriptions
            const activeSubscriptions = await UserSubscription.count({
                where: {
                    SubscriptionPlanId: id,
                    status: 'active',
                    endDate: {
                        [Op.gt]: new Date()
                    }
                }
            });

            if (activeSubscriptions > 0) {
                return {
                    status: false,
                    message: "Cannot delete plan with active subscriptions",
                    data: null
                };
            }

            // Delete the plan
            await plan.destroy();

            return {
                status: true,
                message: "Subscription plan deleted successfully",
                data: null
            };
        } catch (error) {
            return {
                status: false,
                message: "Failed to delete subscription plan",
                error: error.message
            };
        }
    },

    async getAllUserSubscriptions(query = {}) {
        try {
            const page = parseInt(query.page) || 1;
            const pageSize = parseInt(query.pageSize) || 10;
            const offset = (page - 1) * pageSize;

            // Build where clause
            const whereClause = {};

            // Add search functionality
            if (query.searchKey) {
                whereClause[Op.or] = [
                    { '$User.businessName$': { [Op.like]: `%${query.searchKey}%` } },
                    { '$User.fullName$': { [Op.like]: `%${query.searchKey}%` } },
                    { '$User.email$': { [Op.like]: `%${query.searchKey}%` } },
                    { paymentMethod: { [Op.like]: `%${query.searchKey}%` } }
                ];
            }

            // Add status filter
            if (query.status) {
                whereClause.status = query.status;
            }

            // Add payment status filter
            if (query.paymentStatus) {
                whereClause.paymentStatus = query.paymentStatus;
            }

            // Add date range filter
            if (query.startDate && query.endDate) {
                whereClause.startDate = {
                    [Op.between]: [
                        new Date(new Date(query.startDate).setHours(0, 0, 0)),
                        new Date(new Date(query.endDate).setHours(23, 59, 59))
                    ]
                };
            }

            // Get total count for pagination
            const totalCount = await UserSubscription.count({
                where: whereClause,
                include: [{
                    model: User,
                    attributes: ['name', 'email', 'phone']
                }]
            });

            const totalPages = Math.ceil(totalCount / pageSize);

            // Get paginated subscriptions with related data
            const subscriptions = await UserSubscription.findAll({
                where: whereClause,
                include: [
                    {
                        model: User,

                    },
                    {
                        model: SubscriptionPlan,

                    }
                ],
                order: [['createdAt', 'DESC']],
                limit: pageSize,
                offset: offset
            });

            return {
                status: true,
                message: "Subscriptions retrieved successfully",
                data: {
                    subscriptions,
                    pagination: {
                        page,
                        pageSize,
                        totalPages,
                        totalItems: totalCount,
                        hasNextPage: page < totalPages,
                        hasPreviousPage: page > 1
                    }
                }
            };

        } catch (error) {
            return {
                status: false,
                message: "Failed to retrieve subscriptions",
                error: error.message
            };
        }
    },

    async updateSubscriptionPayment(subscriptionId, updateData) {
        try {
            const subscription = await UserSubscription.findByPk(subscriptionId, {
                include: [
                    {
                        model: User,
                    },
                    {
                        model: SubscriptionPlan,
                    }
                ]
            });

            if (!subscription) {
                return {
                    status: false,
                    message: "Subscription not found",
                    data: null
                };
            }

            // Update payment status and other relevant fields
            await subscription.update({
                paymentStatus: updateData.paymentStatus,
                paymentMethod: updateData.paymentMethod || subscription.paymentMethod,
                status: updateData.paymentStatus === 'completed' ? 'active' : subscription.status
            });

            return {
                status: true,
                message: "Subscription payment updated successfully",
                data: subscription
            };

        } catch (error) {
            return {
                status: false,
                message: "Failed to update subscription payment",
                error: error.message
            };
        }
    },

    async checkSubscriptionStatus(subscriptionId) {
        try {
            const subscription = await UserSubscription.findByPk(subscriptionId, {
                include: [
                    {
                        model: User,
                        attributes: ['email', 'fullName', 'businessName']
                    },
                    {
                        model: SubscriptionPlan,
                        attributes: ['name', 'price']
                    }
                ]
            });

            if (!subscription) {
                return {
                    status: false,
                    message: "Subscription not found",
                    data: null
                };
            }

            const now = new Date();
            const endDate = new Date(subscription.endDate);
            const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

            let status = subscription.status;
            if (now > endDate && status === 'active') {
                status = 'expired';
                await subscription.update({ status: 'expired' });
            }

            return {
                status: true,
                message: "Subscription status checked successfully",
                data: {
                    ...subscription.toJSON(),
                    daysRemaining: Math.max(0, daysRemaining),
                    isExpired: status === 'expired'
                }
            };
        } catch (error) {
            return {
                status: false,
                message: "Failed to check subscription status",
                error: error.message
            };
        }
    },

    async checkAllSubscriptions() {
        try {
            // Update expired subscriptions
            const [updatedCount] = await UserSubscription.update(
                { status: 'expired' },
                {
                    where: {
                        status: 'active',
                        endDate: {
                            [Op.lt]: new Date()
                        }
                    }
                }
            );

            return {
                status: true,
                message: "Subscription check completed",
                data: {
                    expiredCount: updatedCount
                }
            };
        } catch (error) {
            return {
                status: false,
                message: "Failed to check subscriptions",
                error: error.message
            };
        }
    },

    async checkSubscriptionLimits(userId) {
        try {
            // Get active subscription with plan details
            const subscription = await UserSubscription.findOne({
                where: {
                    UserId: userId,
                    status: 'active',
                    endDate: {
                        [Op.gt]: new Date()
                    },
                    paymentStatus: 'completed'
                },
                include: [{
                    model: SubscriptionPlan,
                    attributes: ['maxProducts', 'maxStorage', 'maxUsers', 'name']
                }]
            });

            if (!subscription) {
                return {
                    status: false,
                    message: "No active subscription found",
                    data: null
                };
            }

            // Get current usage statistics
            const [productCount, childUserCount, storageUsed] = await Promise.all([
                // Count products
                Product.count({
                    where: { UserId: userId }
                }),
                // Count child users
                UserRole.count({
                    where: {
                        parentUserId: userId,
                        status: 'active'
                    }
                }),
                // Calculate storage used
                this.calculateStorageUsed(userId)
            ]);

            const maxStorage = parseStorageSize(subscription.SubscriptionPlan.maxStorage);
            const storageUsedMB = Math.round(storageUsed / (1024 * 1024) * 100) / 100; // Convert to MB
            const maxStorageMB = Math.round(maxStorage / (1024 * 1024) * 100) / 100; // Convert to MB

            const limits = {
                subscription: {
                    plan: subscription.SubscriptionPlan.name,
                    status: subscription.status,
                    expiryDate: subscription.endDate
                },
                products: {
                    used: productCount,
                    limit: subscription.SubscriptionPlan.maxProducts,
                    remaining: subscription.SubscriptionPlan.maxProducts - productCount,
                    percentageUsed: (productCount / subscription.SubscriptionPlan.maxProducts) * 100
                },
                users: {
                    used: childUserCount,
                    limit: subscription.SubscriptionPlan.maxUsers,
                    remaining: subscription.SubscriptionPlan.maxUsers - childUserCount,
                    percentageUsed: (childUserCount / subscription.SubscriptionPlan.maxUsers) * 100
                },
                storage: {
                    used: storageUsedMB,
                    limit: maxStorageMB,
                    remaining: maxStorageMB - storageUsedMB,
                    percentageUsed: (storageUsed / maxStorage) * 100,
                    unit: 'MB'
                }
            };

            return {
                status: true,
                message: "Subscription limits retrieved successfully",
                data: limits
            };

        } catch (error) {
            return {
                status: false,
                message: "Failed to check subscription limits",
                error: error.message
            };
        }
    },

    // Helper method to calculate storage used
    async calculateStorageUsed(userId) {
        try {
            const uploadDir = path.join(__dirname, '../../public/uploads');
            let totalSize = 0;

            const files = await fs.promises.readdir(uploadDir);
            for (const file of files) {
                if (file.startsWith(userId + '_')) {
                    const stats = await fs.promises.stat(path.join(uploadDir, file));
                    totalSize += stats.size;
                }
            }

            return totalSize;
        } catch (error) {
            console.error('Error calculating storage:', error);
            return 0;
        }
    }
};

module.exports = SubscriptionService; 