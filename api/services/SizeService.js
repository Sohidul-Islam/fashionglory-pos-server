const { Size } = require('../entity');

const SizeService = {
    async create(sizeData, userId) {
        try {
            const size = await Size.create({
                ...sizeData,
                UserId: userId
            });
            return { status: true, message: "Size created successfully", data: size };
        } catch (error) {
            return { status: false, message: "Failed to create size", data: null, error };
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

            const sizes = await Size.findAll({ where: whereClause });
            return { status: true, message: "Sizes retrieved successfully", data: sizes };
        } catch (error) {
            return { status: false, message: "Failed to retrieve sizes", data: null, error };
        }
    },

    async getById(id) {
        try {
            const size = await Size.findByPk(id);
            if (!size) {
                return { status: false, message: "Size not found", data: null };
            }
            return { status: true, message: "Size retrieved successfully", data: size };
        } catch (error) {
            return { status: false, message: "Failed to retrieve size", data: null, error };
        }
    },

    async update(id, updateData) {
        try {
            const size = await Size.findByPk(id);
            if (!size) {
                return { status: false, message: "Size not found", data: null };
            }
            const filteredUpdateData = Object.keys(updateData).reduce((acc, key) => {
                if (updateData[key] !== undefined && updateData[key] !== null && updateData[key] !== '') {
                    acc[key] = updateData[key];
                }
                return acc;
            }, {});

            await size.update(filteredUpdateData);
            return { status: true, message: "Size updated successfully", data: size };
        } catch (error) {
            return { status: false, message: "Failed to update size", data: null, error };
        }
    },

    async delete(id) {
        try {
            const size = await Size.findByPk(id);
            if (!size) {
                return { status: false, message: "Size not found", data: null };
            }
            await size.destroy();
            return { status: true, message: "Size deleted successfully", data: null };
        } catch (error) {
            return { status: false, message: "Failed to delete size", data: null, error };
        }
    }
};

module.exports = SizeService; 