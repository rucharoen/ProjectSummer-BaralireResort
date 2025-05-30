module.exports = (sequelize, Sequelize) => {
    const Icon = sequelize.define("icon", {
        id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    type: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    value: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
        }
    });
    return Icon;
}
        
