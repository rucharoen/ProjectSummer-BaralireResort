const controller = require("../controllers/auth.contrroller");

module.exports = (app) => {
    //app.get("/api/signup", controller.signup);
    app.post("/api/auth/signin", controller.signin);
};
