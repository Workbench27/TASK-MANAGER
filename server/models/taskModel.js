import { DataTypes } from 'sequelize';
import { sequelize } from '../utils/connectDB.js'; // your Sequelize instance

import UserModel from './userModel.js'; 
const User = UserModel(sequelize);
const Task = sequelize.define('Task', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  createdAtDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  priority: {
    type: DataTypes.ENUM('high', 'medium', 'normal', 'low'),
    defaultValue: 'normal',
  },
  stage: {
    type: DataTypes.ENUM('todo', 'in progress', 'completed'),
    defaultValue: 'todo',
  },
  description: {
    type: DataTypes.TEXT,
  },
  isTrashed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  timestamps: true,
  tableName: 'tasks',
});

User.hasMany(Task, { foreignKey: 'userId' });
Task.belongsTo(User, { foreignKey: 'userId' });

export default Task;
