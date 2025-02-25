import express from "express";
import {
  createWebsite,
  getWebsiteContent,
} from "../controllers/websiteController.js";
import isAuthenticated from "../middlewares/authMiddleware.js";

const router = express.Router();

// Protected routes
router.post("/create", isAuthenticated, createWebsite);
router.get("/:id", isAuthenticated, getWebsiteContent);

export default router;
