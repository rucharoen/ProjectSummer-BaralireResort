module.exports = (sequelize, Sequelize) => {
    const Pomotion = sequelize.define("pomotion", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        condition: {
            type: Sequelize.TEXT,
            allowNull: true,
        },
        percent: {
            type: Sequelize.TEXT,
            allowNull: true,
        },
        period: {
            type: Sequelize.TEXT,
            allowNull: true,
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: true,
        },
    });
    return Pomotion;
}