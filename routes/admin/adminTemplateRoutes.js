import express from "express";
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getAllTemplates,
} from "../../controllers/adminTemplateController.js";
import { isAdmin } from "../../middlewares/adminMiddleware.js";

const router = express.Router();

// All routes require admin authentication
router.use(isAdmin);

router.post("/", createTemplate);
router.put("/:templateId", updateTemplate);
router.delete("/:templateId", deleteTemplate);
router.get("/", getAllTemplates);

export default router;
