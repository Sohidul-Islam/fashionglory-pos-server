const sequelize = require('../db');
const { User, UserRole, UserSubscription, SubscriptionPlan } = require('../entity');
const { Op } = require('sequelize');

const UserRoleService = {
    async addChildUser(parentId, userData) {
        const transaction = await sequelize.transaction();
        try {
            // Check subscription limits
            const subscription = await UserSubscription.findOne({
                where: {
                    UserId: parentId,
                    status: 'active',
                    endDate: {
                        [Op.gt]: new Date()
                    }
                },
                include: [{
                    model: SubscriptionPlan
                }]
            });

            if (!subscription) {
                throw new Error("No active subscription found");
            }

            // Check user limit
            const currentUserCount = await UserRole.count({
                where: {
                    parentUserId: parentId,
                    status: 'active'
                }
            });

            if (currentUserCount >= subscription.SubscriptionPlan.maxUsers) {
                throw new Error("User limit reached for your subscription plan");
            }


            // Create user role
            const userRole = await UserRole.create({
                ...userData,
                parentUserId: parentId,
                permissions: userData.permissions || getDefaultPermissions(userData.role)
            }, { transaction });

            await transaction.commit();

            return {
                status: true,
                message: "Child user created successfully",
                data: {
                    role: userRole
                }
            };

        } catch (error) {
            await transaction.rollback();
            return {
                status: false,
                message: "Failed to create child user",
                error: error.message
            };
        }
    },

    async updateUserRole(userId, updateData) {
        try {
            const userRole = await UserRole.findOne({
                where: { userId }
            });

            if (!userRole) {
                return {
                    status: false,
                    message: "User role not found",
                    data: null
                };
            }

            await userRole.update({
                role: updateData.role || userRole.role,
                permissions: {
                    ...userRole.permissions,
                    ...updateData.permissions
                },
                status: updateData.status || userRole.status
            });

            return {
                status: true,
                message: "User role updated successfully",
                data: userRole
            };
        } catch (error) {
            return {
                status: false,
                message: "Failed to update user role",
                error: error.message
            };
        }
    },

    async getChildUsers(parentId, query = {}) {
        try {
            const whereClause = {
                parentUserId: parentId
            };

            if (query.role) whereClause.role = query.role;
            if (query.status) whereClause.status = query.status;

            const childUsers = await UserRole.findAll({
                where: whereClause,
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'email', 'fullName', 'phone', 'status']
                }]
            });

            return {
                status: true,
                message: "Child users retrieved successfully",
                data: childUsers
            };
        } catch (error) {
            return {
                status: false,
                message: "Failed to retrieve child users",
                error: error.message
            };
        }
    }
};

// Helper function to get default permissions based on role
function getDefaultPermissions(role) {
    const permissions = {
        manager: {
            products: ['view', 'create', 'edit', 'delete'],
            orders: ['view', 'create', 'edit', 'delete'],
            reports: ['view'],
            settings: ['view', 'edit']
        },
        employee: {
            products: ['view'],
            orders: ['view', 'create'],
            reports: ['view'],
            settings: ['view']
        }
    };

    return permissions[role] || {};
}

module.exports = UserRoleService; 