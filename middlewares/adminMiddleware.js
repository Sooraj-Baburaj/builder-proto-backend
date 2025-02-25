import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

export const isAdmin = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        message: "Access denied. No token provided.",
        error: true,
      });
    }

    const decoded = jwt.verify(token, process.env.SECRET);
    const admin = await Admin.findOne({ _id: decoded.id, role: decoded.role });

    if (!admin) {
      return res.status(403).json({
        message: "Access denied. Admin privileges required.",
        error: true,
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      message: "Invalid token",
      error: true,
    });
  }
};

export const isSuperAdmin = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        message: "Access denied. No token provided.",
        error: true,
      });
    }

    const decoded = jwt.verify(token, process.env.SECRET);
    const admin = await Admin.findOne({
      _id: decoded.id,
      role: "super_admin",
    });

    if (!admin) {
      return res.status(403).json({
        message: "Access denied. Super admin privileges required.",
        error: true,
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      message: "Invalid token",
      error: true,
    });
  }
};
