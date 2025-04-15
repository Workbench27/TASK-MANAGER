import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import { db } from "../utils/connectDB.js"; // Adjust path as needed

const protectRoute = asyncHandler(async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res
      .status(401)
      .json({ status: false, message: "Not authorized. Try login again." });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await db.promise().query(
      "SELECT id, email, isAdmin FROM users WHERE id = ?",
      [decodedToken.userId]
    );

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ status: false, message: "User not found." });
    }

    const user = rows[0];

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
