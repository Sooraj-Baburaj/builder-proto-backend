import express from "express";
import {
  registerUser,
  forgotPassword,
  resetPassword,
  userAuth,
  googleLogin,
} from "../controllers/users.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", userAuth);
router.post("/google-auth", googleLogin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
