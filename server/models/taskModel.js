import { DataTypes } from 'sequelize';
import { sequelize } from '../utils/connectDB.js'; // your Sequelize instance

const Task = sequelize.define('Task', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
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
  // assets: {
  //   type: DataTypes.JSON, // Array of strings
  //   defaultValue: [],
  // },
  links: {
    type: DataTypes.JSON, // Array of strings
    defaultValue: [],
  },
  isTrashed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  timestamps: true,
});

export default Task;
