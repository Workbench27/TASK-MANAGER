// import asyncHandler from "express-async-handler";
// import db from "../config/db.js";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import createJWT from "../utils/index.js";

// // POST request - login user
// const loginUser = asyncHandler(async (req, res) => {
//   const { email, password } = req.body;
//   const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);

//   const user = rows[0];

//   if (!user) {
//     return res.status(401).json({ status: false, message: "Invalid email or password." });
//   }

//   if (!user.is_active) {
//     return res.status(401).json({
//       status: false,
//       message: "User account has been deactivated, contact the administrator",
//     });
//   }

//   const isMatch = await bcrypt.compare(password, user.password);

//   if (isMatch) {
//     createJWT(res, user.id);
//     delete user.password;
//     res.status(200).json(user);
//   } else {
//     return res.status(401).json({ status: false, message: "Invalid email or password" });
//   }
// });

// // POST - Register a new user
// const registerUser = asyncHandler(async (req, res) => {
//   const { name, email, password, isAdmin, role, title } = req.body;

//   const [existing] = await db.execute("SELECT id FROM users WHERE email = ?", [email]);
//   if (existing.length > 0) {
//     return res.status(400).json({ status: false, message: "Email address already exists" });
//   }

//   const hashedPassword = await bcrypt.hash(password, 10);

//   const [result] = await db.execute(
//     "INSERT INTO users (name, email, password, is_admin, role, title) VALUES (?, ?, ?, ?, ?, ?)",
//     [name, email, hashedPassword, isAdmin ?? false, role, title]
//   );

//   const newUserId = result.insertId;
//   if (isAdmin) createJWT(res, newUserId);

//   const user = { id: newUserId, name, email, isAdmin, role, title };
//   res.status(201).json(user);
// });

// // POST -  Logout user / clear cookie
// const logoutUser = (req, res) => {
//   res.cookie("token", "", {
//     httpOnly: true,
//     expires: new Date(0),
//   });
//   res.status(200).json({ message: "Logged out successfully" });
// };

// const getTeamList = asyncHandler(async (req, res) => {
//   const { search } = req.query;
//   let query = "SELECT id, name, title, role, email, is_active FROM users";
//   let params = [];

//   if (search) {
//     query += ` WHERE name LIKE ? OR title LIKE ? OR role LIKE ? OR email LIKE ?`;
//     const term = `%${search}%`;
//     params = [term, term, term, term];
//   }

//   const [rows] = await db.execute(query, params);
//   res.status(200).json(rows);
// });

// const updateUserProfile = asyncHandler(async (req, res) => {
//   const { userId, isAdmin } = req.user;
//   const { _id, name, title, role } = req.body;
//   const id = isAdmin && userId !== _id ? _id : userId;

//   const [userRows] = await db.execute("SELECT * FROM users WHERE id = ?", [id]);
//   const user = userRows[0];

//   if (!user) {
//     return res.status(404).json({ status: false, message: "User not found" });
//   }

//   await db.execute(
//     "UPDATE users SET name = ?, title = ?, role = ? WHERE id = ?",
//     [name ?? user.name, title ?? user.title, role ?? user.role, id]
//   );

//   const [updated] = await db.execute("SELECT id, name, email, title, role, is_active FROM users WHERE id = ?", [id]);
//   res.status(201).json({ status: true, message: "Profile Updated Successfully.", user: updated[0] });
// });

// const activateUserProfile = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const { isActive } = req.body;

//   await db.execute("UPDATE users SET is_active = ? WHERE id = ?", [isActive, id]);

//   res.status(201).json({
//     status: true,
//     message: `User account has been ${isActive ? "activated" : "disabled"}`,
//   });
// });

// const changeUserPassword = asyncHandler(async (req, res) => {
//   const { userId } = req.user;
//   const { password } = req.body;

//   const hashedPassword = await bcrypt.hash(password, 10);
//   await db.execute("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId]);

//   res.status(201).json({ status: true, message: "Password changed successfully." });
// });

// const deleteUserProfile = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   await db.execute("DELETE FROM users WHERE id = ?", [id]);
//   res.status(200).json({ status: true, message: "User deleted successfully" });
// });

// const getNotificationsList = asyncHandler(async (req, res) => {
//   const { userId } = req.user;

//   const [rows] = await db.execute(
//     `SELECT n.*, t.title AS task_title
//      FROM notices n
//      LEFT JOIN tasks t ON n.task_id = t.id
//      WHERE JSON_CONTAINS(n.team, JSON_QUOTE(?)) AND NOT JSON_CONTAINS(n.is_read, JSON_QUOTE(?))
//      ORDER BY n.id DESC`,
//     [userId, userId]
//   );

//   res.status(200).json(rows);
// });

// const getUserTaskStatus = asyncHandler(async (req, res) => {
//   const [rows] = await db.execute(
//     `SELECT u.id AS user_id, u.name, t.title, t.stage
//      FROM users u
//      LEFT JOIN user_tasks ut ON u.id = ut.user_id
//      LEFT JOIN tasks t ON ut.task_id = t.id
//      ORDER BY u.id DESC`
//   );

//   res.status(200).json(rows);
// });

// const markNotificationRead = asyncHandler(async (req, res) => {
//   try {
//     const { userId } = req.user;
//     const { isReadType, id } = req.query;

//     if (isReadType === "all") {
//       await db.execute(
//         `UPDATE notices
//          SET is_read = JSON_ARRAY_APPEND(is_read, '$', ?)
//          WHERE JSON_CONTAINS(team, JSON_QUOTE(?)) AND NOT JSON_CONTAINS(is_read, JSON_QUOTE(?))`,
//         [userId, userId, userId]
//       );
//     } else {
//       await db.execute(
//         `UPDATE notices
//          SET is_read = JSON_ARRAY_APPEND(is_read, '$', ?)
//          WHERE id = ? AND NOT JSON_CONTAINS(is_read, JSON_QUOTE(?))`,
//         [userId, id, userId]
//       );
//     }
//     res.status(201).json({ status: true, message: "Done" });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ status: false, message: "Internal Server Error" });
//   }
// });

// export {
//   activateUserProfile,
//   changeUserPassword,
//   deleteUserProfile,
//   getTeamList,
//   loginUser,
//   logoutUser,
//   registerUser,
//   updateUserProfile,
//   getNotificationsList,
//   getUserTaskStatus,
//   markNotificationRead
// };




import asyncHandler from "express-async-handler";
import { db } from "../utils/connectDB.js";
import bcrypt from "bcryptjs";
import createJWT from "../utils/index.js";


// POST request - login user
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  const user = rows[0];

  if (!user) {
    return res.status(401).json({ status: false, message: "Invalid email or password." });
  }

  if (!user.isActive) {
    return res.status(401).json({ status: false, message: "User account has been deactivated, contact the administrator" });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (isMatch) {
    createJWT(res, user.id);
    delete user.password;
    res.status(200).json(user);
  } else {
    return res.status(401).json({ status: false, message: "Invalid email or password" });
  }
});

// POST - Register a new user
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, isAdmin = false, role, title } = req.body;

  const [existing] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

  if (existing.length > 0) {
    return res.status(400).json({ status: false, message: "Email address already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const [result] = await db.query(
    "INSERT INTO users (name, email, password, isAdmin, role, title) VALUES (?, ?, ?, ?, ?, ?)",
    [name, email, hashedPassword, isAdmin, role, title]
  );

  const [userRows] = await db.query("SELECT * FROM users WHERE id = ?", [result.insertId]);
  const user = userRows[0];
  delete user.password;

  if (isAdmin) createJWT(res, user.id);

  res.status(201).json(user);
});

const logoutUser = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: "Logged out successfully" });
};

const getTeamList = asyncHandler(async (req, res) => {
  const { search } = req.query;
  let query = "SELECT name, title, role, email, isActive FROM users";

  if (search) {
    query += ` WHERE name LIKE '%${search}%' OR title LIKE '%${search}%' OR role LIKE '%${search}%' OR email LIKE '%${search}%'`;
  }

  const [users] = await db.query(query);
  res.status(201).json(users);
});

const getNotificationsList = asyncHandler(async (req, res) => {
  const { userId } = req.user;

  const [notices] = await db.query(
    `SELECT n.*, t.title as taskTitle FROM notices n JOIN tasks t ON n.taskId = t.id WHERE FIND_IN_SET(?, n.team) AND NOT FIND_IN_SET(?, n.isRead) ORDER BY n.id DESC`,
    [userId, userId]
  );

  res.status(200).json(notices);
});

const getUserTaskStatus = asyncHandler(async (req, res) => {
  const [users] = await db.query(
    `SELECT u.id, u.name, t.title, t.stage FROM users u LEFT JOIN tasks t ON FIND_IN_SET(u.id, t.team) ORDER BY u.id DESC`
  );

  res.status(200).json(users);
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { isReadType, id } = req.query;

  if (isReadType === "all") {
    await db.query(`UPDATE notices SET isRead = CONCAT_WS(',', IFNULL(isRead, ''), ?) WHERE FIND_IN_SET(?, team) AND NOT FIND_IN_SET(?, isRead)`, [userId, userId, userId]);
  } else {
    await db.query(`UPDATE notices SET isRead = CONCAT_WS(',', IFNULL(isRead, ''), ?) WHERE id = ? AND NOT FIND_IN_SET(?, isRead)`, [userId, id, userId]);
  }

  res.status(201).json({ status: true, message: "Done" });
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const { userId, isAdmin } = req.user;
  const { _id, name, title, role } = req.body;

  const id = isAdmin && userId === _id ? userId : isAdmin && userId !== _id ? _id : userId;

  await db.query(
    `UPDATE users SET name = ?, title = ?, role = ? WHERE id = ?`,
    [name, title, role, id]
  );

  const [userRows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
  const user = userRows[0];
  delete user.password;

  res.status(201).json({ status: true, message: "Profile Updated Successfully.", user });
});

const activateUserProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  await db.query("UPDATE users SET isActive = ? WHERE id = ?", [isActive, id]);

  res.status(201).json({ status: true, message: `User account has been ${isActive ? "activated" : "disabled"}` });
});

const changeUserPassword = asyncHandler(async (req, res) => {
  const { userId } = req.user;

  if (userId === "65ff94c7bb2de638d0c73f63") {
    return res.status(404).json({ status: false, message: "This is a test user. You can not chnage password. Thank you!!!" });
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  await db.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId]);

  res.status(201).json({ status: true, message: `Password chnaged successfully.` });
});

const deleteUserProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await db.query("DELETE FROM users WHERE id = ?", [id]);

  res.status(200).json({ status: true, message: "User deleted successfully" });
});

export {
  activateUserProfile,
  changeUserPassword,
  deleteUserProfile,
  getNotificationsList,
  getTeamList,
  getUserTaskStatus,
  loginUser,
  logoutUser,
  markNotificationRead,
  registerUser,
  updateUserProfile,
};