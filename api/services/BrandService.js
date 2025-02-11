const { Brand } = require('../entity');

const BrandService = {
    async create(brandData, userId) {
        try {
            const brand = await Brand.create({
                ...brandData,
                UserId: userId
            });
            return { status: true, message: "Brand created successfully", data: brand };
        } catch (error) {
            return { status: false, message: "Failed to create brand", data: null, error };
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

            const brands = await Brand.findAll({
                where: whereClause
            });
            return { status: true, message: "Brands retrieved successfully", data: brands };
        } catch (error) {
            return { status: false, message: "Failed to retrieve brands", data: null, error };
        }
    },

    async getById(id, userId) {
        try {
            const brand = await Brand.findOne({
                where: {
                    id: id,
                    UserId: userId
                }
            });
            if (!brand) {
                return { status: false, message: "Brand not found", data: null };
            }
            return { status: true, message: "Brand retrieved successfully", data: brand };
        } catch (error) {
            return { status: false, message: "Failed to retrieve brand", data: null, error };
        }
    },

    async update(id, updateData, userId) {
        try {
            const brand = await Brand.findOne({
                where: {
                    id: id,
                    UserId: userId
                }
            });
            if (!brand) {
                return { status: false, message: "Brand not found", data: null };
            }
            await brand.update(updateData);
            return { status: true, message: "Brand updated successfully", data: brand };
        } catch (error) {
            return { status: false, message: "Failed to update brand", data: null, error };
        }
    },

    async delete(id, userId) {
        try {
            const brand = await Brand.findOne({
                where: {
                    id: id,
                    UserId: userId
                }
            });
            if (!brand) {
                return { status: false, message: "Brand not found", data: null };
            }
            await brand.destroy();
            return { status: true, message: "Brand deleted successfully", data: null };
        } catch (error) {
            return { status: false, message: "Failed to delete brand", data: null, error };
        }
    }
};

module.exports = BrandService; 