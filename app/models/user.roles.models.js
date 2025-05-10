module.exports = (sequelize, Sequelize) => {
    const UserRole = sequelize.define("user_role", {
        userID: Sequelize.INTEGER,
        roleID: Sequelize.INTEGER
    });
    return UserRole;
}