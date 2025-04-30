import asyncHandler from "express-async-handler";
import { Op, fn, col, where } from "sequelize";
import TaskActivity from "../models/taskActivityModel.js";
import Task from "../models/taskModel.js";
import UserModel from "../models/userModel.js";
import { sequelize } from "../utils/connectDB.js";
import sendEmail from "../utils/sendEmail.js";

// initialize models
const User = UserModel(sequelize);

// ADD THIS ONCE — ASSOCIATION:
User.hasMany(Task, { foreignKey: 'userId' });
Task.belongsTo(User, { foreignKey: 'userId' });

Task.hasMany(TaskActivity, { foreignKey: 'taskId' });
TaskActivity.belongsTo(Task, { foreignKey: 'taskId' });

User.hasMany(TaskActivity, { foreignKey: 'userId' });
TaskActivity.belongsTo(User, { foreignKey: 'userId' });

const sendTaskReminders = async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateOnly = tomorrow.toISOString().split("T")[0];

    const tasks = await Task.findAll({
      where: {
        isTrashed: false,
        stage: { [Op.not]: "completed" },
        dueDate: {
          [Op.eq]: tomorrowDateOnly,
        },
      },
      include: [
        {
          model: User,
          attributes: ["email", "name"],
        },
      ],
    });

    for (const task of tasks) {
      const user = task.User;
      if (!user?.email) continue;

      const emailHtml = `
        <h2>Reminder: Your Task is Due Tomorrow!</h2>
        <p><strong>Title:</strong> ${task.title}</p>
        <p><strong>Due:</strong> ${new Date(task.dueDate).toDateString()}</p>
        <p><strong>Priority:</strong> ${task.priority}</p>
        <p><strong>Description:</strong> ${task.description}</p>
      `;

      await sendEmail(
        user.email,
        `⏰ Reminder: "${task.title}" is due tomorrow`,
        emailHtml
      );

      console.log(`📧 Reminder sent to ${user.email} for task "${task.title}"`);
    }
  } catch (error) {
    console.error("❌ Error sending task reminders:", error);
  }
};

const createTask = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.user;
    let { title, stage, dueDate, priority, description } = req.body;

    if (!title || !dueDate || !priority || !stage) {
      return res.status(400).json({
        status: false,
        message: "Title, dueDate, priority, and stage are required!",
      });
    }

    // 🟢 Normalize inputs
    const normalizedTitle = title.trim().toLowerCase();
    const normalizedDescription = description.trim().toLowerCase();
    const normalizedDueDate = new Date(dueDate).toISOString().split("T")[0];

    // 🔍 Check for duplicates (case-insensitive)
    const duplicateTask = await Task.findOne({
      where: {
        userId,
        [Op.and]: [
          where(fn("LOWER", col("title")), normalizedTitle),
          where(fn("LOWER", col("description")), normalizedDescription),
          where(fn("DATE", col("dueDate")), normalizedDueDate),
        ],
      },
    });

    if (duplicateTask) {
      return res.status(409).json({
        status: false,
        warning: true,
        message: "Duplicate task: A task with the same title, due date, and description already exists.",
        duplicateTask,
      });
    }

    // 🟢 Create task
    const task = await Task.create({
      title: normalizedTitle,
      stage: stage.toLowerCase(),
      dueDate: normalizedDueDate,
      priority: priority.toLowerCase(),
      description: normalizedDescription,
      userId,
    });

    res.status(201).json({ status: true, task, message: "Task created successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
});

const updateTask = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;  // Get the task ID from URL parameters
    const { title, stage, dueDate, priority, description } = req.body;

    // Parse the ID to ensure it's an integer
    const parsedId = parseInt(id, 10);

    // Check if the parsed ID is a valid number
    if (isNaN(parsedId)) {
      return res.status(400).json({ status: false, message: "Invalid task ID." });
    }

    // Try to find the task by primary key (id)
    const task = await Task.findByPk(parsedId);

    // If the task doesn't exist, return a 404 error
    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found." });
    }

    // Proceed to update the task with the new values
    await task.update({
      title,
      dueDate,
      stage: stage.toLowerCase(),
      priority: priority.toLowerCase(),
      description,
    });

    res.status(200).json({ status: true, message: "Task updated successfully." });
  } catch (error) {
    console.error(error);  // Log the error to help debugging
    return res.status(500).json({ status: false, message: error.message });
  }
});

const updateTaskStage = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params; // ✅ Get task ID from URL params
    const { stage } = req.body; // ✅ Get the new stage value

    const parsedId = parseInt(id, 10); // ✅ Parse ID safely

    // Check if ID and stage are valid
    if (isNaN(parsedId) || !stage) {
      return res.status(400).json({
        status: false,
        message: "Valid task ID and stage are required.",
      });
    }

    // Find the task by ID
    const task = await Task.findByPk(parsedId);

    if (!task) {
      return res.status(404).json({
        status: false,
        message: "Task not found.",
      });
    }

   // After updating the task stage
await task.update({ stage: stage.toLowerCase() });

// Then pass updated values directly
if (stage.toLowerCase() === 'completed') {
  await CompletedTask.create({
    id: task.id,
    title: task.title,
    createdAtDate: task.createdAtDate,
    dueDate: task.dueDate,
    priority: task.priority,
    stage: stage.toLowerCase(), // ✅ use fresh value
    description: task.description,
    isTrashed: true, // ✅ make sure it's boolean
    userId: task.userId,
    createdAt: task.createdAt,
    updatedAt: new Date(), // ✅ or use task.updatedAt if you must
  });

  await Task.destroy({ where: { id: parsedId } });
}

    res.status(200).json({
      status: true,
      message: "Task stage changed successfully.",
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});


const getTasks = asyncHandler(async (req, res) => {
  const { userId } = req.user;  // Only userId is available now
  const { stage, isTrashed, search } = req.query;

  let where = {
    isTrashed: isTrashed ? true : false,
    userId,  // Filter tasks by the userId of the logged-in user
  };

  // If stage is provided in the query, filter tasks by stage
  if (stage) {
    where.stage = stage;
  }

  // If search query is provided, search tasks by title, stage, or priority
  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { stage: { [Op.iLike]: `%${search}%` } },
      { priority: { [Op.iLike]: `%${search}%` } },
    ];
  }

  try {
    const tasks = await Task.findAll({
      where,
      order: [["id", "DESC"]],
    });

    res.status(200).json({
      status: true,
      tasks,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
});

const getTask = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);

    if (isNaN(parsedId)) {
      return res.status(400).json({ status: false, message: "Invalid task ID." });
    }

    const task = await Task.findByPk(parsedId, {
      include: [
        {
          model: TaskActivity,
          include: [
            {
              model: User,
              attributes: ["name", "email"],
            },
          ],
          order: [["id", "DESC"]], // Order TaskActivity by id DESC
        },
      ],
    });

    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found." });
    }

    res.status(200).json({
      status: true,
      task,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: "Failed to fetch task" });
  }
});

const trashTask = asyncHandler(async (req, res) => {
  // Get the task ID from the URL parameters and parse it as a number
  const { id } = req.params;
  const parsedId = parseInt(id, 10);  // Parse the id to an integer

  try {
    // Check if the parsed ID is a valid number
    if (isNaN(parsedId)) {
      return res.status(400).json({ status: false, message: "Invalid task ID." });
    }

    // Try to find the task by primary key (id)
    const task = await Task.findByPk(parsedId);

    // Check if the task exists
    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found." });
    }

    // Update the task to set isTrashed to true
    await task.update({ isTrashed: true });

    res.status(200).json({ status: true, message: "Task trashed successfully." });
  } catch (error) {
    console.error(error);  // Log the error to help debugging
    return res.status(500).json({ status: false, message: error.message });
  }
});

const postTaskActivity = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params; // task ID from URL
    const { userId } = req.user; // populated from middleware
    const { activity, type } = req.body; // now expecting `type` too

    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({ status: false, message: "Invalid task ID." });
    }

    const task = await Task.findByPk(parsedId);
    if (!task) {
      return res.status(404).json({ status: false, message: 'Task not found.' });
    }

    await TaskActivity.create({
      taskId: task.id,
      userId: userId || null,
      activity,
      type: type?.toLowerCase() || 'assigned', // fallback to "assigned"
    });

    res.status(200).json({ status: true, message: 'Activity posted successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message });
  }
});

const getTaskActivities = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;  // task ID from URL
    const parsedId = parseInt(id, 10);

    if (isNaN(parsedId)) {
      return res.status(400).json({ status: false, message: "Invalid task ID." });
    }

    // Fetch task activities
    const activities = await TaskActivity.findAll({
      where: {
        taskId: parsedId,
      },
      include: [
        {
          model: User,
          attributes: ["name", "email"], // User details (Assuming you want them)
        },
      ],
      order: [["id", "DESC"]],  // Sort activities by ID descending
    });

    if (!activities || activities.length === 0) {
      return res.status(404).json({ status: false, message: "No activities found." });
    }

    res.status(200).json({
      status: true,
      activities,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Failed to fetch task activities" });
  }
});

const deleteRestoreTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { actionType } = req.query;

  try {
    if (actionType === "delete") {
      await Task.destroy({ where: { id } });
    } else if (actionType === "deleteAll") {
      await Task.destroy({ where: { isTrashed: true } });
    } else if (actionType === "restore") {
      await Task.update({ isTrashed: false }, { where: { id } });
    } else if (actionType === "restoreAll") {
      await Task.update({ isTrashed: false }, { where: { isTrashed: true } });
    }

    res.status(200).json({
      status: true,
      message: "Operation performed successfully.",
    });
  } catch (error) {
    return res.status(400).json({ status: false, message: error.message });
  }
});

const dashboardStatistics = asyncHandler(async (req, res) => {
  const { userId } = req.user;

  try {
    const where = {
      isTrashed: false,
      userId, // ✅ Filter tasks by logged-in user
    };

    const allTasks = await Task.findAll({
      where,
      order: [["id", "DESC"]],
    });

    const groupedTasks = allTasks.reduce((result, task) => {
      const stage = task.stage;
      result[stage] = (result[stage] || 0) + 1;
      return result;
    }, {});

    const graphData = Object.entries(
      allTasks.reduce((result, task) => {
        const { priority } = task;
        result[priority] = (result[priority] || 0) + 1;
        return result;
      }, {})
    ).map(([name, total]) => ({ name, total }));

    const totalTasks = allTasks.length;
    const last10Task = allTasks.slice(0, 10);

    const summary = {
      totalTasks,
      last10Task,
      tasks: groupedTasks,
      graphData,
    };

    res.status(200).json({ status: true, ...summary, message: "Successfully." });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
});


export {
  sendTaskReminders,
  createTask,
  dashboardStatistics,
  deleteRestoreTask,
  getTask,
  getTasks,
  postTaskActivity,
  getTaskActivities,
  trashTask,
  updateTask,
  updateTaskStage,
};
