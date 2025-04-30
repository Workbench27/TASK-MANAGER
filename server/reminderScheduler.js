import cron from "node-cron";
import { sendTaskReminders } from "./controllers/taskController.js";

// Runs every day at 9 AM
cron.schedule("0 9 * * *", () => {
  console.log("⏰ Running task reminder job...");
  sendTaskReminders();
});
