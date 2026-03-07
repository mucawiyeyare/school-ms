import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { createEnrollment, listEnrollments } from "../controllers/enrollment.controller.js";

const router = Router();

router.get("/", requireAuth, listEnrollments);
router.post("/", requireAuth, requireRole(["Admin"]), createEnrollment);

export default router;