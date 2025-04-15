import asyncHandler from "express-async-handler";
// import { Task, User, Notice, SubTask } from "../models";

// CREATE TASK
const createTask = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { title, team, stage, date, priority, assets, links, description } = req.body;

  let text = "New task has been assigned to you";
  if (team?.length > 1) {
    text += ` and ${team.length - 1} others.`;
  }

  text += ` The task priority is set a ${priority} priority, so check and act accordingly. The task date is ${new Date(date).toDateString()}. Thank you!!!`;

  const activity = {
    type: "assigned",
    activity: text,
    by: userId,
  };

  const task = await Task.create({
    title,
    stage: stage.toLowerCase(),
    date,
    priority: priority.toLowerCase(),
    assets,
    links: links?.split(",") || [],
    description,
    activities: [activity],
  });

  await task.setUsers(team);
  await Notice.create({ team: JSON.stringify(team), text, taskId: task.id });

  res.status(200).json({ status: true, task, message: "Task created successfully." });
});

// DUPLICATE TASK
const duplicateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;

  const task = await Task.findByPk(id, { include: [User] });

  let text = "New task has been assigned to you";
  if (task.Users?.length > 1) {
    text += ` and ${task.Users.length - 1} others.`;
  }

  text += ` The task priority is set a ${task.priority} priority, so check and act accordingly. The task date is ${new Date(task.date).toDateString()}. Thank you!!!`;

  const activity = {
    type: "assigned",
    activity: text,
    by: userId,
  };

  const newTask = await Task.create({
    title: "Duplicate - " + task.title,
    date: task.date,
    stage: task.stage,
    priority: task.priority,
    assets: task.assets,
    links: task.links,
    description: task.description,
    activities: [activity],
  });

  await newTask.setUsers(task.Users.map(u => u.id));
  await Notice.create({ team: JSON.stringify(task.Users.map(u => u.id)), text, taskId: newTask.id });

  res.status(200).json({ status: true, message: "Task duplicated successfully." });
});

// UPDATE TASK
const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, date, team, stage, priority, assets, links, description } = req.body;

  const task = await Task.findByPk(id);
  task.title = title;
  task.date = date;
  task.priority = priority.toLowerCase();
  task.assets = assets;
  task.stage = stage.toLowerCase();
  task.links = links?.split(",") || [];
  task.description = description;

  await task.save();
  await task.setUsers(team);

  res.status(200).json({ status: true, message: "Task updated successfully." });
});

// UPDATE TASK STAGE
const updateTaskStage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { stage } = req.body;

  const task = await Task.findByPk(id);
  task.stage = stage.toLowerCase();
  await task.save();

  res.status(200).json({ status: true, message: "Task stage changed successfully." });
});

// UPDATE SUBTASK STAGE
const updateSubTaskStage = asyncHandler(async (req, res) => {
  const { taskId, subTaskId } = req.params;
  const { status } = req.body;

  await SubTask.update({ isCompleted: status }, { where: { id: subTaskId, taskId } });

  res.status(200).json({
    status: true,
    message: status ? "Task has been marked completed" : "Task has been marked uncompleted",
  });
});

// CREATE SUBTASK
const createSubTask = asyncHandler(async (req, res) => {
  const { title, tag, date } = req.body;
  const { id } = req.params;

  await SubTask.create({
    title,
    tag,
    date,
    isCompleted: false,
    taskId: id,
  });

  res.status(200).json({ status: true, message: "SubTask added successfully." });
});

// GET TASKS
const getTasks = asyncHandler(async (req, res) => {
  const { userId, isAdmin } = req.user;
  const { stage, isTrashed, search } = req.query;

  const where = { isTrashed: isTrashed === "true" };

  if (!isAdmin) {
    where["$Users.id$"] = userId;
  }
  if (stage) where.stage = stage;

  if (search) {
    where[Op.or] = [
      { title: { [Op.like]: `%${search}%` } },
      { stage: { [Op.like]: `%${search}%` } },
      { priority: { [Op.like]: `%${search}%` } },
    ];
  }

  const tasks = await Task.findAll({
    where,
    include: [{ model: User, attributes: ["name", "title", "email"] }],
    order: [["id", "DESC"]],
  });

  res.status(200).json({ status: true, tasks });
});

// GET SINGLE TASK
const getTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const task = await Task.findByPk(id, {
    include: [
      { model: User, attributes: ["name", "title", "role", "email"] },
    ],
  });

  res.status(200).json({ status: true, task });
});

// POST TASK ACTIVITY
const postTaskActivity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;
  const { type, activity } = req.body;

  const task = await Task.findByPk(id);
  task.activities.push({ type, activity, by: userId });

  await task.save();

  res.status(200).json({ status: true, message: "Activity posted successfully." });
});

// TRASH TASK
const trashTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const task = await Task.findByPk(id);
  task.isTrashed = true;
  await task.save();

  res.status(200).json({ status: true, message: "Task trashed successfully." });
});

// DELETE / RESTORE TASK
const deleteRestoreTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { actionType } = req.query;

  if (actionType === "delete") {
    await Task.destroy({ where: { id } });
  } else if (actionType === "deleteAll") {
    await Task.destroy({ where: { isTrashed: true } });
  } else if (actionType === "restore") {
    await Task.update({ isTrashed: false }, { where: { id } });
  } else if (actionType === "restoreAll") {
    await Task.update({ isTrashed: false }, { where: { isTrashed: true } });
  }

  res.status(200).json({ status: true, message: "Operation performed successfully." });
});

// DASHBOARD STATS
const dashboardStatistics = asyncHandler(async (req, res) => {
  const { userId, isAdmin } = req.user;

  const tasks = await Task.findAll({
    where: {
      isTrashed: false,
      ...(isAdmin ? {} : { "$Users.id$": userId }),
    },
    include: [{ model: User, attributes: ["name", "title", "role", "email"] }],
  });

  const groupedTasks = tasks.reduce((acc, task) => {
    acc[task.stage] = (acc[task.stage] || 0) + 1;
    return acc;
  }, {});

  const graphData = Object.entries(
    tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, total]) => ({ name, total }));

  const users = isAdmin
    ? await User.findAll({
        where: { isActive: true },
        attributes: ["name", "title", "role", "createdAt"],
        limit: 10,
        order: [["id", "DESC"]],
      })
    : [];

  res.status(200).json({
    status: true,
    totalTasks: tasks.length,
    last10Task: tasks.slice(0, 10),
    users,
    tasks: groupedTasks,
    graphData,
    message: "Successfully.",
  });
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
