const mongoose = require("mongoose");

const db = {};
db.mongoose = mongoose;
db.url = process.env.MONGO_URL || "mongodb://localhost:27017/appdb";

db.tutorials = require("./tutorial.model.js")(mongoose);

module.exports = db;
