import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config(); // Load .env variables

console.log("✅ ENV DEBUG:");
console.log("MYSQL_HOST:", process.env.MYSQL_HOST);
console.log("MYSQL_USER:", process.env.MYSQL_USER);
console.log("MYSQL_PASSWORD:", process.env.MYSQL_PASSWORD);
console.log("MYSQL_DATABASE:", process.env.MYSQL_DATABASE);

let db; // This will hold the connection

const dbConnection = async () => {
  try {
    db = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });

    console.log("✅ MySQL connected successfully.");
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message);
    throw err;
  }
};

export default dbConnection;
export { db };
