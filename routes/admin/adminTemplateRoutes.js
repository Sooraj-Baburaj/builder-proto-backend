import express from "express";
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getAllTemplates,
} from "../../controllers/adminTemplateController.js";
import { isAdmin } from "../../middlewares/adminMiddleware.js";

const router = express.Router();

router.post("/", isAdmin, createTemplate);
router.put("/:templateId", isAdmin, updateTemplate);
router.delete("/:templateId", isAdmin, deleteTemplate);
router.get("/", getAllTemplates);

export default router;
