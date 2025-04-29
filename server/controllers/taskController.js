import asyncHandler from "express-async-handler";
import { Op, fn, col, where } from "sequelize";

import Task from "../models/taskModel.js";
import UserModel from "../models/userModel.js";
import { sequelize } from "../utils/connectDB.js";
// initialize models
const User = UserModel(sequelize);

// ADD THIS ONCE — ASSOCIATION:
User.hasMany(Task, { foreignKey: 'userId' });
Task.belongsTo(User, { foreignKey: 'userId' });


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
    const { id } = req.params; // ✅ like updateTask
    const { stage } = req.body;

    const parsedId = parseInt(id, 10); // ✅ parse ID safely

    if (isNaN(parsedId) || !stage) {
      return res.status(400).json({
        status: false,
        message: "Valid task ID and stage are required.",
      });
    }

    const task = await Task.findByPk(parsedId);

    if (!task) {
      return res.status(404).json({
        status: false,
        message: "Task not found.",
      });
    }

    await task.update({ stage: stage.toLowerCase() });

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

    const task = await Task.findByPk(id, {
      include: [
        {
          model: User,
          as: "teamMembers", // define proper association in models
          attributes: ["name", "title", "role", "email"],
        },
      ],
      order: [["id", "DESC"]],
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
    res.status(400).json({ status: false, message: "Failed to fetch task" });
  }
});

const postTaskActivity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;
  const { type, activity } = req.body;

  try {
    const task = await Task.findByPk(id);

    const activities = task.activities || [];
    activities.push({ type, activity, by: userId });

    await task.update({ activities });

    res.status(200).json({ status: true, message: "Activity posted successfully." });
  } catch (error) {
    return res.status(400).json({ status: false, message: error.message });
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
  createTask,
  dashboardStatistics,
  deleteRestoreTask,
  getTask,
  getTasks,
  postTaskActivity,
  trashTask,
  updateTask,
  updateTaskStage,
};
