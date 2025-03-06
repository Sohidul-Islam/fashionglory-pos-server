const { SubscriptionPlan, UserSubscription, Coupon } = require('../entity');
const { Op } = require('sequelize');
const CouponService = require('./CouponService');

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
    }
};

module.exports = SubscriptionService; 