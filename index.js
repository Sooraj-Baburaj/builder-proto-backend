// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors"; // Import the cors package
import userRoutes from "./routes/userRoutes.js";
import websiteRoutes from "./routes/websiteRoutes.js";
import adminRoutes from "./routes/admin/index.js";

dotenv.config();

const app = express();
app.use(cors()); // Use the cors middleware
app.use(express.json());

app.get("/api/healthcheck", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(err));

app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/website", websiteRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
