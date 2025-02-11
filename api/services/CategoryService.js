const { Category } = require('../entity');

const CategoryService = {
    async create(categoryData, userId) {
        try {
            const category = await Category.create({
                ...categoryData,
                UserId: userId
            });
            return { status: true, message: "Category created successfully", data: category };
        } catch (error) {
            return { status: false, message: "Failed to create category", data: null, error };
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

            const categories = await Category.findAll({
                where: whereClause
            });
            return { status: true, message: "Categories retrieved successfully", data: categories };
        } catch (error) {
            return { status: false, message: "Failed to retrieve categories", data: null, error };
        }
    },

    async getById(id, userId) {
        try {
            const category = await Category.findOne({
                where: {
                    id: id,
                    UserId: userId
                }
            });
            if (!category) {
                return { status: false, message: "Category not found", data: null };
            }
            return { status: true, message: "Category retrieved successfully", data: category };
        } catch (error) {
            return { status: false, message: "Failed to retrieve category", data: null, error };
        }
    },

    async update(id, updateData, userId) {
        try {
            const category = await Category.findOne({
                where: {
                    id: id,
                    UserId: userId
                }
            });
            if (!category) {
                return { status: false, message: "Category not found", data: null };
            }
            const filteredUpdateData = Object.keys(updateData).reduce((acc, key) => {
                if (updateData[key] !== undefined && updateData[key] !== null && updateData[key] !== '') {
                    acc[key] = updateData[key];
                }
                return acc;
            }, {});

            await category.update(filteredUpdateData);
            return { status: true, message: "Category updated successfully", data: category };
        } catch (error) {
            return { status: false, message: "Failed to update category", data: null, error };
        }
    },

    async delete(id, userId) {
        try {
            const category = await Category.findOne({
                where: {
                    id: id,
                    UserId: userId
                }
            });
            if (!category) {
                return { status: false, message: "Category not found", data: null };
            }
            await category.destroy();
            return { status: true, message: "Category deleted successfully", data: null };
        } catch (error) {
            return { status: false, message: "Failed to delete category", data: null, error };
        }
    }
};

module.exports = CategoryService; 