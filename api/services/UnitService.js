const { Unit } = require('../entity');
const { Op } = require('sequelize');

const UnitService = {
    async create(unitData, userId) {
        try {
            // Check if unit name or shortName already exists for this user
            const existingUnit = await Unit.findOne({
                where: {
                    [Op.or]: [
                        {
                            name: unitData.name,
                            UserId: userId
                        },
                        {
                            shortName: unitData.shortName,
                            UserId: userId
                        }
                    ]
                }
            });

            if (existingUnit) {
                return {
                    status: false,
                    message: existingUnit.name === unitData.name
                        ? "Unit name already exists for this user"
                        : "Unit short name already exists for this user",
                    data: null
                };
            }

            const unit = await Unit.create({
                ...unitData,
                UserId: userId
            });
            return { status: true, message: "Unit created successfully", data: unit };
        } catch (error) {
            return { status: false, message: "Failed to create unit", data: null, error };
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

            const units = await Unit.findAll({ where: whereClause });
            return { status: true, message: "Units retrieved successfully", data: units };
        } catch (error) {
            return { status: false, message: "Failed to retrieve units", data: null, error };
        }
    },

    async getById(id, userId) {
        try {
            const unit = await Unit.findOne({
                where: {
                    id: id,
                    UserId: userId
                }
            });
            if (!unit) {
                return { status: false, message: "Unit not found", data: null };
            }
            return { status: true, message: "Unit retrieved successfully", data: unit };
        } catch (error) {
            return { status: false, message: "Failed to retrieve unit", data: null, error };
        }
    },

    async update(id, updateData, userId) {
        try {
            const unit = await Unit.findOne({
                where: {
                    id: id,
                    UserId: userId
                }
            });
            if (!unit) {
                return { status: false, message: "Unit not found", data: null };
            }

            // Remove name and shortName from updateData to prevent changes
            const { name, shortName, ...allowedUpdates } = updateData;

            await unit.update(allowedUpdates);
            return { status: true, message: "Unit updated successfully", data: unit };
        } catch (error) {
            return { status: false, message: "Failed to update unit", data: null, error };
        }
    },

    async delete(id, userId) {
        try {
            const unit = await Unit.findOne({
                where: {
                    id: id,
                    UserId: userId
                }
            });
            if (!unit) {
                return { status: false, message: "Unit not found", data: null };
            }
            await unit.destroy();
            return { status: true, message: "Unit deleted successfully", data: null };
        } catch (error) {
            return { status: false, message: "Failed to delete unit", data: null, error };
        }
    }
};

module.exports = UnitService; 