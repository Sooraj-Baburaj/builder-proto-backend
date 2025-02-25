import express from "express";
import { createWebsite } from "../controllers/websiteController.js";
import isAuthenticated from "../middlewares/authMiddleware.js";

const router = express.Router();

// Protected routes
router.post("/create", isAuthenticated, createWebsite);

export default router;
