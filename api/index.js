require("dotenv").config();

const express = require("express");
const cors = require("cors")
const app = express();
const path = require('path');
const sequelize = require("./db");

const port = process.env.SERVER_PORT || 3000

app.use(cors())
app.use(express.json());

app.use(express.static('public'));

// app.use("/api", authRoute);

app.get("/", function (req, res) {
    res.send("welcome pos solution family!");
});

// app.use(ErrorHandler)

sequelize.authenticate().then(() => {
    console.log('Connection has been established successfully.');
}).catch((error) => {
    console.error('Unable to connect to the database: ', error);
});

app.listen(port, () => console.log(`Server ready on port ${port}.`));

module.exports = app;