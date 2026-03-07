import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import {
  listTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  assignSubjects
} from "../controllers/teacher.controller.js";

const router = Router();

// Only admin can manage teachers
router.use(requireAuth, requireRole(["Admin"]));

router.get("/", listTeachers);
router.post("/", createTeacher);
router.put("/:id", updateTeacher);
router.delete("/:id", deleteTeacher);
router.post("/:id/assign", assignSubjects);

export default router;
