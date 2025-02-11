const { Product, Category, Brand, Unit, ProductVariant, Color, Size } = require('../entity');

const ProductService = {
    async create(productData, userId) {
        try {
            const product = await Product.create({
                ...productData,
                UserId: userId
            });
            return { status: true, message: "Product created successfully", data: product };
        } catch (error) {
            return { status: false, message: "Failed to create product", data: null, error };
        }
    },

    async getAll(query = {}) {
        try {
            const products = await Product.findAll({
                include: [
                    { model: Category },
                    { model: Brand },
                    { model: Unit },
                    {
                        model: ProductVariant,
                        include: [
                            { model: Color },
                            { model: Size }
                        ]
                    }
                ],
                where: query
            });
            return { status: true, message: "Products retrieved successfully", data: products };
        } catch (error) {
            return { status: false, message: "Failed to retrieve products", data: null, error };
        }
    },

    async getById(id) {
        try {
            const product = await Product.findByPk(id, {
                include: [
                    { model: Category },
                    { model: Brand },
                    { model: Unit },
                    {
                        model: ProductVariant,
                        include: [
                            { model: Color },
                            { model: Size }
                        ]
                    }
                ]
            });
            if (!product) {
                return { status: false, message: "Product not found", data: null };
            }
            return { status: true, message: "Product retrieved successfully", data: product };
        } catch (error) {
            return { status: false, message: "Failed to retrieve product", data: null, error };
        }
    },

    async update(id, updateData) {
        try {
            const product = await Product.findByPk(id);
            if (!product) {
                return { status: false, message: "Product not found", data: null };
            }
            await product.update(updateData);
            return { status: true, message: "Product updated successfully", data: product };
        } catch (error) {
            return { status: false, message: "Failed to update product", data: null, error };
        }
    },

    async delete(id) {
        try {
            const product = await Product.findByPk(id);
            if (!product) {
                return { status: false, message: "Product not found", data: null };
            }
            await product.destroy();
            return { status: true, message: "Product deleted successfully", data: null };
        } catch (error) {
            return { status: false, message: "Failed to delete product", data: null, error };
        }
    }
};

module.exports = ProductService; 