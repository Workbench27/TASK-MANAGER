import asyncHandler from "express-async-handler";
import { Op } from "sequelize";
import Task from "../models/taskModel.js";
import UserModel from "../models/userModel.js";
import NoticeModel from "../models/notis.js";
import { sequelize } from "../utils/connectDB.js";

// initialize models
const User = UserModel(sequelize);
const Notice = NoticeModel(sequelize);

const createTask = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.user;
    const { title, team, stage, date, priority, assets, links, description } = req.body;

    let text = "New task has been assigned to you";
    if (team?.length > 1) {
      text += ` and ${team.length - 1} others.`;
    }

    text += ` The task priority is set a ${priority} priority, so check and act accordingly. The task date is ${new Date(
      date
    ).toDateString()}. Thank you!!!`;

    const activity = {
      type: "assigned",
      activity: text,
      by: userId,
    };

    const newLinks = links ? links.split(",") : [];

    const task = await Task.create({
      title,
      team, // assuming you’ll handle team-user relationships separately
      stage: stage.toLowerCase(),
      date,
      priority: priority.toLowerCase(),
      assets, // if this is used, uncomment JSON column in model
      activities: activity, // optional: define if needed
      links: newLinks,
      description,
    });

    await Notice.create({
      text,
      taskId: task.id,
    });

    const users = await User.findAll({
      where: {
        id: {
          [Op.in]: team,
        },
      },
    });

    if (users.length) {
      for (const user of users) {
        await user.addTask(task); // assuming association exists: User.hasMany(Task)
      }
    }

    res.status(200).json({ status: true, task, message: "Task created successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
});

const duplicateTask = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    const task = await Task.findByPk(id);
    if (!task) return res.status(404).json({ status: false, message: "Task not found." });

    let text = "New task has been assigned to you";
    if (task.team?.length > 1) {
      text += ` and ${task.team.length - 1} others.`;
    }

    text += ` The task priority is set a ${task.priority} priority, so check and act accordingly. The task date is ${new Date(
      task.date
    ).toDateString()}. Thank you!!!`;

    const activity = {
      type: "assigned",
      activity: text,
      by: userId,
    };

    const newTask = await Task.create({
      title: "Duplicate - " + task.title,
      team: task.team,
      subTasks: task.subTasks, // optional: if defined
      assets: task.assets,
      links: task.links,
      priority: task.priority,
      stage: task.stage,
      activities: activity,
      description: task.description,
    });

    await Notice.create({
      team: newTask.team,
      text,
      taskId: newTask.id,
    });

    res.status(200).json({ status: true, message: "Task duplicated successfully." });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

const updateTask = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, team, stage, priority, assets, links, description } = req.body;

    const task = await Task.findByPk(id);
    if (!task) return res.status(404).json({ status: false, message: "Task not found." });

    const newLinks = links ? links.split(",") : [];

    await task.update({
      title,
      date,
      team,
      stage: stage.toLowerCase(),
      priority: priority.toLowerCase(),
      assets,
      links: newLinks,
      description,
    });

    res.status(200).json({ status: true, message: "Task updated successfully." });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message });
  }
});

const updateTaskStage = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;

    const task = await Task.findByPk(id);
    if (!task) return res.status(404).json({ status: false, message: "Task not found." });

    await task.update({ stage: stage.toLowerCase() });

    res.status(200).json({ status: true, message: "Task stage changed successfully." });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message });
  }
});

const updateSubTaskStage = asyncHandler(async (req, res) => {
  try {
    const { taskId, subTaskId } = req.params;
    const { status } = req.body;

    // You’ll need a separate model/table for subTasks in Sequelize to support this update
    // This is a placeholder until that structure is defined
    res.status(501).json({ status: false, message: "Sub-task stage update not implemented in Sequelize yet." });
  } catch (error) {
    console.log(error);
    res.status(400).json({ status: false, message: error.message });
  }
});

const createSubTask = asyncHandler(async (req, res) => {
  const { title, tag, date } = req.body;
  const { id } = req.params;

  try {
    const task = await Task.findByPk(id);

    if (!task) return res.status(404).json({ status: false, message: "Task not found." });

    const subTasks = task.subTasks || [];
    subTasks.push({ title, tag, date, isCompleted: false });

    await task.update({ subTasks });

    res.status(200).json({ status: true, message: "SubTask added successfully." });
  } catch (error) {
    return res.status(400).json({ status: false, message: error.message });
  }
});

const getTasks = asyncHandler(async (req, res) => {
  const { userId, isAdmin } = req.user;
  const { stage, isTrashed, search } = req.query;

  let where = {
    isTrashed: isTrashed ? true : false,
  };

  if (!isAdmin) {
    where.team = {
      [Op.contains]: [userId], // assuming team is stored as an array in JSON column
    };
  }

  if (stage) {
    where.stage = stage;
  }

  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { stage: { [Op.iLike]: `%${search}%` } },
      { priority: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const tasks = await Task.findAll({
    where,
    order: [["id", "DESC"]],
  });

  res.status(200).json({
    status: true,
    tasks,
  });
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
  const { id } = req.params;

  try {
    const task = await Task.findByPk(id);
    if (!task) return res.status(404).json({ status: false, message: "Task not found." });

    await task.update({ isTrashed: true });

    res.status(200).json({ status: true, message: "Task trashed successfully." });
  } catch (error) {
    return res.status(400).json({ status: false, message: error.message });
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
  const { userId, isAdmin } = req.user;

  try {
    const where = {
      isTrashed: false,
    };

    if (!isAdmin) {
      where.team = {
        [Op.contains]: [userId], // team is stored as array
      };
    }

    const allTasks = await Task.findAll({
      where,
      order: [["id", "DESC"]],
    });

    const users = isAdmin
      ? await User.findAll({
          where: { isActive: true },
          attributes: ["name", "title", "role", "isActive", "createdAt"],
          limit: 10,
          order: [["id", "DESC"]],
        })
      : [];

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
      users,
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
  createSubTask,
  createTask,
  dashboardStatistics,
  deleteRestoreTask,
  duplicateTask,
  getTask,
  getTasks,
  postTaskActivity,
  trashTask,
  updateSubTaskStage,
  updateTask,
  updateTaskStage,
};
