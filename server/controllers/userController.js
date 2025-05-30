import asyncHandler from "express-async-handler";
import Users from "../models/userModel.js";
import createJWT from "../utils/index.js";
import { sequelize } from "../utils/connectDB.js";

// Pass sequelize to model definition function
const User = Users(sequelize);

// POST - Login user
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({
    where: { email },
    attributes: ["id", "email", "password", "isActive", "isAdmin"],
  });

  if (!user) {
    return res.status(401).json({
      status: false,
      message: "Invalid email or password.",
    });
  }

  if (!user.isActive) {
    return res.status(401).json({
      status: false,
      message: "User account has been deactivated, contact the administrator.",
    });
  }

  const isMatch = await user.matchPassword(password);

  if (isMatch) {
    createJWT(res, user.id);

    // Remove password from response
    const { password, ...userInfo } = user.toJSON();

    res.status(200).json({
      status: true,
      message: "Login successful",
      user: userInfo,
    });
  } else {
    return res.status(401).json({
      status: false,
      message: "Invalid email or password.",
    });
  }
});

// POST - Register a new user
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, isAdmin = false, role, title } = req.body;

  const userExists = await User.findOne({
    where: { email },
    attributes: ["email"],
  });

  if (userExists) {
    return res.status(400).json({
      status: false,
      message: "Email address already exists.",
    });
  }

  const user = await User.create({
    name,
    email,
    password,  // Will be hashed by model hook
    isAdmin,
    role,
    title,
  });

  createJWT(res, user.id);

  // Remove password from response
  const { password: _, ...userInfo } = user.toJSON();

  res.status(201).json({
    status: true,
    message: "User registered successfully.",
    user: userInfo,
  });
});


// POST - Logout user / clear cookie
const logoutUser = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: "Logged out successfully" });
};

// @GET - Get user task status
const getUserTaskStatus = asyncHandler(async (req, res) => {
  const tasks = await User.findAll({
    include: {
      model: Task,
      attributes: ["title", "stage"],
    },
    order: [["createdAt", "DESC"]],
  });

  res.status(200).json(tasks);
});

// PUT - Update user profile
const updateUserProfile = asyncHandler(async (req, res) => {
  const { userId, isAdmin } = req.user;
  const { id, name, title, role } = req.body;

  const user =
    isAdmin && userId === id
      ? await User.findByPk(userId)
      : isAdmin && userId !== id
      ? await User.findByPk(id)
      : await User.findByPk(userId);

  if (user) {
    user.name = name || user.name;
    user.title = title || user.title;
    user.role = role || user.role;

    const updatedUser = await user.save();

    updatedUser.password = undefined;

    res.status(201).json({
      status: true,
      message: "Profile Updated Successfully.",
      user: updatedUser,
    });
  } else {
    res.status(404).json({ status: false, message: "User not found" });
  }
});

// PUT - Activate/deactivate user profile
const activateUserProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByPk(id);

  if (user) {
    user.isActive = req.body.isActive;

    await user.save();

    user.password = undefined;

    res.status(201).json({
      status: true,
      message: `User account has been ${
        user?.isActive ? "activated" : "disabled"
      }`,
    });
  } else {
    res.status(404).json({ status: false, message: "User not found" });
  }
});

// PUT - Change user password
const changeUserPassword = asyncHandler(async (req, res) => {
  const { userId } = req.user;

  const user = await User.findByPk(userId);

  if (user) {
    user.password = req.body.password;

    await user.save();

    user.password = undefined;

    res.status(201).json({
      status: true,
      message: `Password changed successfully.`,
    });
  } else {
    res.status(404).json({ status: false, message: "User not found" });
  }
});

// DELETE - Delete user account
const deleteUserProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await User.destroy({ where: { id } });

  res.status(200).json({ status: true, message: "User deleted successfully" });
});

export {
  activateUserProfile,
  changeUserPassword,
  deleteUserProfile,
  getUserTaskStatus,
  loginUser,
  logoutUser,
  registerUser,
  updateUserProfile,
};
