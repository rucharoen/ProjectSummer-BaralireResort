module.exports = (sequelize, Sequelize) => {
    const Award = sequelize.define("award", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: Sequelize.STRING
        },
        image_name: {
            type: Sequelize.STRING,
            allowNull: true
        },
    });
    return Award;
}