module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "coins",
    {
      cointype: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      amount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
    },
    {
      timestamps: false,
    }
  );
};
