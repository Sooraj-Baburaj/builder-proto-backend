import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

export const registerAdmin = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
        error: true,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({
      email,
      password: hashedPassword,
      role: role || "admin",
    });

    await admin.save();
    res.status(201).json({
      message: "Admin created successfully",
      admin: { email: admin.email, role: admin.role },
      error: false,
    });
  } catch (error) {
    if (error?.code === 11000) {
      res.status(400).json({ message: "Email already exists!", error: true });
    } else {
      res.status(500).json({ message: "Internal server error", error: true });
    }
  }
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({
        message: "Admin not found",
        error: true,
      });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        message: "Invalid credentials",
        error: true,
      });
    }

    const token = jwt.sign(
      {
        email: admin.email,
        id: admin._id,
        role: admin.role,
      },
      process.env.SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      message: "Login successful",
      data: {
        admin_access_token: token,
        role: admin.role,
      },
      error: false,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: true,
    });
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    // Check if the admin exists
    const adminToDelete = await Admin.findById(adminId);

    if (!adminToDelete) {
      return res.status(404).json({
        message: "Admin not found",
        error: true,
      });
    }

    // Prevent deletion of super_admin
    if (adminToDelete.role === "super_admin") {
      return res.status(403).json({
        message: "Super admin cannot be deleted",
        error: true,
      });
    }

    // Delete the admin
    await Admin.findByIdAndDelete(adminId);

    res.status(200).json({
      message: "Admin deleted successfully",
      error: false,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting admin",
      error: true,
    });
  }
};
