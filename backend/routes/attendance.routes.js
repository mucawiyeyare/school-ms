import express from "express";
import { takeAttendance, getAttendance, getStudentAttendance } from "../controllers/attendance.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = express.Router();

router.get("/", requireAuth, getAttendance);
router.get("/student/:studentId", requireAuth, getStudentAttendance);
router.post("/", requireAuth, requireRole(["Admin", "Teacher"]), takeAttendance);

export default router;
