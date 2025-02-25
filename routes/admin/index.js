import express from "express";

import templateRoutes from "./adminTemplateRoutes.js";
import adminRoutes from "./adminRoutes.js";

const router = express.Router();

router.use("/", adminRoutes);
router.use("/templates", templateRoutes);

export default router;
