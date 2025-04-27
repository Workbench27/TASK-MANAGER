import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import { sequelize } from "../utils/connectDB.js";  // ✅ Only import 'sequelize'
import UserModel from "../models/userModel.js";  // ✅ Import the user model

// Get the actual User model by passing sequelize instance
const User = UserModel(sequelize);

const protectRoute = asyncHandler(async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({
      status: false,
      message: "Not authorized. Try login again.",
    });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded JWT Token:", decodedToken);

    // Use Sequelize method to find the user
    const user = await User.findOne({
      where: { id: decodedToken.userId },
    });

    if (!user) {
      return res
        .status(401)
        .json({ status: false, message: "User not found." });
    }

    if (!user.isActive) {
      return res.status(401).json({
        status: false,
        message: "User account has been deactivated, contact the administrator",
      });
    }

    req.user = {
      email: user.email,
      isAdmin: user.isAdmin,
      userId: user.id,
    };

    next();
  } catch (error) {
    console.error(error);
    return res
      .status(401)
      .json({ status: false, message: "Not authorized. Try login again." });
  }
});

const isAdminRoute = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    return res.status(401).json({
      status: false,
      message: "Not authorized as admin. Try login as admin.",
    });
  }
};

export { isAdminRoute, protectRoute };
