import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();  // Ensure this is at the top of the file to load environment variables.

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE,  // Database name
  process.env.MYSQL_USER,      // Username
  process.env.MYSQL_PASSWORD,  // Password
  {
    host: process.env.MYSQL_HOST,  // Database host
    dialect: 'mysql',
    logging: false,  // Set this to true if you want to see SQL queries in the console
  }
);

const connectToDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connected via Sequelize.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    throw error;  // Ensure error is thrown so that the process can stop on failure
  }
};

export { sequelize, connectToDB };
