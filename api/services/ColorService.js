const { Color } = require('../entity');

const ColorService = {
    async create(colorData, userId) {
        try {
            const color = await Color.create({
                ...colorData,
                UserId: userId
            });
            return { status: true, message: "Color created successfully", data: color };
        } catch (error) {
            return { status: false, message: "Failed to create color", data: null, error };
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

            const colors = await Color.findAll({ where: whereClause });
            return { status: true, message: "Colors retrieved successfully", data: colors };
        } catch (error) {
            return { status: false, message: "Failed to retrieve colors", data: null, error };
        }
    },

    async getById(id) {
        try {
            const color = await Color.findByPk(id);
            if (!color) {
                return { status: false, message: "Color not found", data: null };
            }
            return { status: true, message: "Color retrieved successfully", data: color };
        } catch (error) {
            return { status: false, message: "Failed to retrieve color", data: null, error };
        }
    },

    async update(id, updateData) {
        try {
            const color = await Color.findByPk(id);
            if (!color) {
                return { status: false, message: "Color not found", data: null };
            }
            const filteredUpdateData = Object.keys(updateData).reduce((acc, key) => {
                if (updateData[key] !== undefined && updateData[key] !== null && updateData[key] !== '') {
                    acc[key] = updateData[key];
                }
                return acc;
            }, {});

            await color.update(filteredUpdateData);
            return { status: true, message: "Color updated successfully", data: color };
        } catch (error) {
            return { status: false, message: "Failed to update color", data: null, error };
        }
    },

    async delete(id) {
        try {
            const color = await Color.findByPk(id);
            if (!color) {
                return { status: false, message: "Color not found", data: null };
            }
            await color.destroy();
            return { status: true, message: "Color deleted successfully", data: null };
        } catch (error) {
            return { status: false, message: "Failed to delete color", data: null, error };
        }
    }
};

module.exports = ColorService; 