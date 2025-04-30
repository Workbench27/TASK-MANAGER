// import { DataTypes } from 'sequelize';
// import { sequelize } from '../utils/connectDB.js'; // your Sequelize instance

// import UserModel from './userModel.js';
// import TaskModel from './taskModel.js';

// const User = UserModel(sequelize);
// const Task = TaskModel;

// const TaskActivity = sequelize.define('TaskActivity', {
//   id: {
//     type: DataTypes.INTEGER,
//     autoIncrement: true,
//     primaryKey: true,
//   },
//   taskId: {
//     type: DataTypes.INTEGER,
//     allowNull: false,
//     references: {
//       model: Task,
//       key: 'id',
//     },
//   },
//   userId: {
//     type: DataTypes.INTEGER,
//     allowNull: true,
//     references: {
//       model: User,
//       key: 'id',
//     },
//   },
//   activity: {
//     type: DataTypes.TEXT,
//   },
//   created_at: {
//     type: DataTypes.DATE,
//     defaultValue: DataTypes.NOW,
//   },
// }, {
//   timestamps: false,
//   tableName: 'task_activities',
// });

// // Associations
// Task.hasMany(TaskActivity, { foreignKey: 'taskId' });
// TaskActivity.belongsTo(Task, { foreignKey: 'taskId' });

// User.hasMany(TaskActivity, { foreignKey: 'userId' });
// TaskActivity.belongsTo(User, { foreignKey: 'userId' });

// export default TaskActivity;



import { DataTypes } from 'sequelize';
import { sequelize } from '../utils/connectDB.js'; // your Sequelize instance

import UserModel from './userModel.js';
import TaskModel from './taskModel.js';

const User = UserModel(sequelize);
const Task = TaskModel;

const TaskActivity = sequelize.define('TaskActivity', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  taskId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Task,
      key: 'id',
    },
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'id',
    },
  },
  type: {
    type: DataTypes.ENUM(
      'assigned',
      'started',
      'in progress',
      'bug',
      'completed',
      'commented'
    ),
    defaultValue: 'assigned',
  },
  activity: {
    type: DataTypes.TEXT,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false,
  tableName: 'task_activities',
});

// Associations
Task.hasMany(TaskActivity, { foreignKey: 'taskId' });
TaskActivity.belongsTo(Task, { foreignKey: 'taskId' });

User.hasMany(TaskActivity, { foreignKey: 'userId' });
TaskActivity.belongsTo(User, { foreignKey: 'userId' });

export default TaskActivity;
