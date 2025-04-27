import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler, routeNotFound } from "./middleware/errorMiddleware.js";
import routes from "./routes/index.js";
import { connectToDB } from "./utils/connectDB.js";

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

// Main API routes
app.use("/api", routes);

// Error handlers
app.use(routeNotFound);
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectToDB();

    app.listen(port, () => {
      console.log(`🚀 Server listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();