const express = require("express");
const app = express();
const db = require("./app/models");
const cors = require("cors");
const path = require("path");
require("dotenv/config");

app.use(cors({ origin: "*" }));

app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// db.booking.sync({ alter: true })
//     .then(() => {
//         console.log("Create table already.")
//     })
//     .catch((err) => {
//         console.log(err);
//     })

db.sequelize.sync({ force: false }).then(() => {
    console.log("Database sync...");
});

app.get("/", (req, res) => {
    res.send("Hello World");
    // console.log("Hello World");
})

require("./app/routes/auth.routes")(app);
require("./app/routes/accommodation.routes")(app);
require("./app/routes/activity.routes")(app);
require("./app/routes/type.routes")


const PORT = process.env.SERVER_PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
});