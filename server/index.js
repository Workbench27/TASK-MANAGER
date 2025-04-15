import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import { errorHandler, routeNotFound } from "./middleware/errorMiddleware.js";
import routes from "./routes/index.js";
import dbConnection from "./utils/connectDB.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 8800;

app.use(
  cors({
    origin: [
      "https://mern-task-manager-app.netlify.app",
      "http://localhost:3000",
      "http://localhost:3001",
    ],
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// app.use(morgan("dev"));

app.use("/api", routes);
app.use(routeNotFound);
app.use(errorHandler);

const startServer = async () => {
  try {
    await dbConnection();

    app.listen(port, () =>
      console.log(`🚀 Server listening on http://localhost:${port}`)
    );

    console.log("✅ ENV DEBUG:");
    console.log("MYSQL_HOST:", process.env.MYSQL_HOST);
    console.log("MYSQL_USER:", process.env.MYSQL_USER);
    console.log("MYSQL_PASSWORD:", process.env.MYSQL_PASSWORD);
    console.log("MYSQL_DATABASE:", process.env.MYSQL_DATABASE);
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
