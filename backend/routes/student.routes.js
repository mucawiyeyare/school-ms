import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { uploadPhoto } from "../middleware/upload.js";
import {
  createStudent,
  listStudents,
  studentHistory,
  getMyProfile,
  getMyResults,
  updateMyProfile,
  getStudentById,
  updateStudent,
  deleteStudent,
} from "../controllers/student.controller.js";

const router = Router();

// Student self-service (MUST be before /:id to prevent Express matching "me" as an id)
router.get("/me", requireAuth, requireRole(["Student"]), getMyProfile);
router.get("/me/results", requireAuth, requireRole(["Student"]), getMyResults);
router.put("/me", requireAuth, requireRole(["Student"]), updateMyProfile);

// Admin / Teacher routes
router.get("/",    requireAuth, listStudents);
router.post("/",   requireAuth, requireRole(["Admin"]), uploadPhoto, createStudent);

// Single student (admin / teacher)
router.get("/:id",    requireAuth, getStudentById);
router.put("/:id",    requireAuth, requireRole(["Admin"]), updateStudent);
router.delete("/:id", requireAuth, requireRole(["Admin"]), deleteStudent);

// Legacy history endpoint (kept for backwards compatibility)
router.get("/:id/history", requireAuth, studentHistory);

export default router;