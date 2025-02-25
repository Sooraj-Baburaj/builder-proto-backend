import express from "express";
import {
  registerAdmin,
  adminLogin,
  deleteAdmin,
} from "../../controllers/adminController.js";
import { isSuperAdmin } from "../../middlewares/adminMiddleware.js";

const router = express.Router();

router.post("/register", isSuperAdmin, registerAdmin);
router.delete("/:adminId", isSuperAdmin, deleteAdmin);

router.post("/login", adminLogin);

export default router;
