const User = require('./User');
const Product = require('./Product');
const Category = require('./Category');
const Brand = require('./Brand');
const Unit = require('./Unit');
const Order = require('./Order');
const Color = require('./Color');
const Size = require('./Size');
const ProductVariant = require('./ProductVariant');
const OrderItem = require('./OrderItem');
const StockHistory = require('./StockHistory');

// User Associations
User.hasMany(Product);
User.hasMany(Category);
User.hasMany(Brand);
User.hasMany(Unit);
User.hasMany(Color);
User.hasMany(Size);

// Product Associations
Product.belongsTo(User);
Product.belongsTo(Category);
Product.belongsTo(Brand);
Product.belongsTo(Unit);
Product.belongsTo(Size);
Product.belongsTo(Color);


// Category Associations
Category.belongsTo(User);
Category.hasMany(Product);

// Brand Associations
Brand.belongsTo(User);
Brand.hasMany(Product);

// Unit Associations
Unit.belongsTo(User);
Unit.hasMany(Product);

// Color & Size Associations
Color.belongsTo(User);
Size.belongsTo(User);

// Product Variant Associations
Product.hasMany(ProductVariant);
ProductVariant.belongsTo(Product);
ProductVariant.belongsTo(Color);
ProductVariant.belongsTo(Size);


// Order Associations
Order.belongsTo(User);
Order.hasMany(OrderItem);
OrderItem.belongsTo(Order);

// OrderItem Associations
OrderItem.belongsTo(Product);
OrderItem.belongsTo(ProductVariant);

// StockHistory Associations
StockHistory.belongsTo(Product);
StockHistory.belongsTo(ProductVariant);
StockHistory.belongsTo(Order);
StockHistory.belongsTo(User);

module.exports = {
    User,
    Product,
    Category,
    Brand,
    Unit,
    Order,
    Color,
    Size,
    ProductVariant,
    OrderItem,
    StockHistory
};