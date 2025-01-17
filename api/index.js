require("dotenv").config();

const express = require("express");
const cors = require("cors")
const app = express();
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');
const requestHandler = require('./utils/requestHandler');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const brandRoutes = require('./routes/brandRoutes');
const unitRoutes = require('./routes/unitRoutes');

const port = process.env.SERVER_PORT || 3000

app.use(cors())
app.use(express.json());

app.use(express.static('public'));


// here we add router

app.use("/api", requestHandler(null, authRoutes));
app.use("/api/products", requestHandler(null, productRoutes));
app.use("/api/categories", requestHandler(null, categoryRoutes));
app.use("/api/brands", requestHandler(null, brandRoutes));
app.use("/api/units", requestHandler(null, unitRoutes));

app.get("/", function (req, res) {
    res.send("welcome pos solution family!");
});

// app.use(ErrorHandler)

app.use(errorHandler);



app.listen(port, () => console.log(`Server ready on port ${port}.`));

module.exports = app;