const express = require ("express");
require("dotenv/config");
const db = require("./app/models");
const app = express();
const cors = require("cors");
const path = require("path")

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors ({origin: "*"}))

db.sequelize.sync({ force: false }).then (() => {
    console.log("Database sync...")
  });

  

  app.get("/", (req, res) => {
    res.send("Hello World!");
  });

  require("./app/routes/auth.routes")(app);
  const PORT = process.env.SERVER_PORT || 5000;
  app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
  });