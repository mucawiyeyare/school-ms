import express from "express";
import { getResults, bulkUpsertResults, getReportCard } from "../controllers/result.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = express.Router();

router.get("/", requireAuth, getResults);
router.get("/report-card/:studentId/:examTermId", requireAuth, getReportCard);
router.post("/bulk", requireAuth, requireRole(["Admin", "Teacher"]), bulkUpsertResults);

export default router;
