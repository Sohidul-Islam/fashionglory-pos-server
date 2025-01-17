const { Brand } = require('../entity');

const BrandService = {
    async create(brandData) {
        try {
            const brand = await Brand.create(brandData);
            return { status: true, message: "Brand created successfully", data: brand };
        } catch (error) {
            return { status: false, message: "Failed to create brand", data: null, error };
        }
    },

    async getAll(query = {}) {
        try {
            const brands = await Brand.findAll({ where: query });
            return { status: true, message: "Brands retrieved successfully", data: brands };
        } catch (error) {
            return { status: false, message: "Failed to retrieve brands", data: null, error };
        }
    },

    async getById(id) {
        try {
            const brand = await Brand.findByPk(id);
            if (!brand) {
                return { status: false, message: "Brand not found", data: null };
            }
            return { status: true, message: "Brand retrieved successfully", data: brand };
        } catch (error) {
            return { status: false, message: "Failed to retrieve brand", data: null, error };
        }
    },

    async update(id, updateData) {
        try {
            const brand = await Brand.findByPk(id);
            if (!brand) {
                return { status: false, message: "Brand not found", data: null };
            }
            await brand.update(updateData);
            return { status: true, message: "Brand updated successfully", data: brand };
        } catch (error) {
            return { status: false, message: "Failed to update brand", data: null, error };
        }
    },

    async delete(id) {
        try {
            const brand = await Brand.findByPk(id);
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