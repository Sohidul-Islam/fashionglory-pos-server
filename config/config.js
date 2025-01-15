require("dotenv").config(); // Load environment variables from .env

module.exports = {
  development: {
    username: process.env.MYSQLUSERNAME_DEV || "root",
    password: process.env.MYSQLPASSWORD_DEV || null,
    database: process.env.DATABASE_DEV || "database_development",
    host: process.env.MYSQLHOST_DEV || "127.0.0.1",
    dialect: "mysql",
    logging: process.env.logging === "true", // Use boolean for logging
  },
  test: {
    username: process.env.MYSQLUSERNAME_DEV || "root",
    password: process.env.MYSQLPASSWORD_DEV || null,
    database: "database_test",
    host: process.env.MYSQLHOST_DEV || "127.0.0.1",
    dialect: "mysql",
  },
  production: {
    username: process.env.MYSQLUSERNAME || "root",
    password: process.env.MYSQLPASSWORD || null,
    database: process.env.DATABASE || "database_production",
    host: process.env.MYSQLHOST || "127.0.0.1",
    dialect: "mysql",
  },
};
