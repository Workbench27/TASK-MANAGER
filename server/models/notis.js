import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Notice = sequelize.define('Notice', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    text: {
      type: DataTypes.TEXT,
    },
    notiType: {
      type: DataTypes.ENUM('alert', 'message'),
      defaultValue: 'alert',
    }
  }, {
    tableName: 'notices',
    timestamps: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
  });

  return Notice;
};
