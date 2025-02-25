import bcrypt from "bcrypt";
import Admin from "../models/Admin.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const seedSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    // Check if super admin already exists
    const existingSuperAdmin = await Admin.findOne({ role: "super_admin" });
    if (existingSuperAdmin) {
      console.log("Super admin already exists!");
      await mongoose.connection.close();
      return;
    }

    // Create super admin
    const hashedPassword = await bcrypt.hash("superadmin123", 10);
    const superAdmin = new Admin({
      email: "superadmin21@gmail.com",
      password: hashedPassword,
      role: "super_admin",
    });

    await superAdmin.save();
    console.log("Super admin created successfully!");

    // Close the connection
    await mongoose.connection.close();
    console.log("Database connection closed.");
  } catch (error) {
    console.error("Error seeding super admin:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the seed function
seedSuperAdmin();
