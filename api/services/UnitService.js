const { Unit } = require('../entity');

const UnitService = {
    async create(unitData) {
        try {
            const unit = await Unit.create(unitData);
            return { status: true, message: "Unit created successfully", data: unit };
        } catch (error) {
            return { status: false, message: "Failed to create unit", data: null, error };
        }
    },

    async getAll(query = {}) {
        try {
            const units = await Unit.findAll({ where: query });
            return { status: true, message: "Units retrieved successfully", data: units };
        } catch (error) {
            return { status: false, message: "Failed to retrieve units", data: null, error };
        }
    },

    async getById(id) {
        try {
            const unit = await Unit.findByPk(id);
            if (!unit) {
                return { status: false, message: "Unit not found", data: null };
            }
            return { status: true, message: "Unit retrieved successfully", data: unit };
        } catch (error) {
            return { status: false, message: "Failed to retrieve unit", data: null, error };
        }
    },

    async update(id, updateData) {
        try {
            const unit = await Unit.findByPk(id);
            if (!unit) {
                return { status: false, message: "Unit not found", data: null };
            }
            await unit.update(updateData);
            return { status: true, message: "Unit updated successfully", data: unit };
        } catch (error) {
            return { status: false, message: "Failed to update unit", data: null, error };
        }
    },

    async delete(id) {
        try {
            const unit = await Unit.findByPk(id);
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