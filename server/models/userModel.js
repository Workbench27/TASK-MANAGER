// import { DataTypes } from 'sequelize';
// import bcrypt from 'bcryptjs';

// export default (sequelize) => {
//   const User = sequelize.define('User', {
//     id: {
//       type: DataTypes.INTEGER,
//       autoIncrement: true,
//       primaryKey: true,
//     },
//     name: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     title: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     role: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     email: {
//       type: DataTypes.STRING,
//       allowNull: false,
//       unique: true,
//     },
//     password: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     isAdmin: {
//       type: DataTypes.BOOLEAN,
//       defaultValue: false,
//     },
//     isActive: {
//       type: DataTypes.BOOLEAN,
//       defaultValue: true,
//     }
//   }, {
//     tableName: 'users',
//     timestamps: true,
//     updatedAt: 'updated_at',
//     createdAt: 'created_at',
//   });

//   // Hash password before saving
//   User.beforeCreate(async (user) => {
//     const salt = await bcrypt.genSalt(10);
//     user.password = await bcrypt.hash(user.password, salt);
//   });

//   // Match password method
//   User.prototype.matchPassword = async function (enteredPassword) {
//     return await bcrypt.compare(enteredPassword, this.password);
//   };

//   return User;
// };



import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';

export default (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    }
  }, {
    tableName: 'users',
    timestamps: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
  });

  // Hash password before saving
  User.beforeCreate(async (user) => {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  });

  // Match password method
  User.prototype.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  };

  return User;
};
