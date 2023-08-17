const express = require("express");
const cookieParser = require("cookie-parser");
const User = require("./Controllers/userController");
const Medicine = require("./Controllers/MedicineController");
const Shop = require("./Controllers/ShopController");
const Order = require("./Controllers/orderController");
const Rider = require("./Controllers/riderController");
const passport = require("passport");
const requestIp = require("request-ip");

const app = express();
require("./configure/passport")(passport);

app.use(requestIp.mw());
app.use(express.json());
app.use(cookieParser());
app.use("/api/v1", User);
app.use("/api/v1", Medicine);
app.use("/api/v1", Shop);
app.use("/api/v1", Order);
app.use("/api/v1", Rider);

module.exports = app;
