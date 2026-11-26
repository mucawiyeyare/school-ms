import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import {
  listExamTypes,
  updateExamType,
  listAssignments,
  createAssignment,
  deleteAssignment,
  getMySubjects,
  getStudentsForMarks,
  getMarks,
  bulkSaveMarks,
  getVisibility,
  updateVisibility,
  getEditLogs,
  getSubjectTotals,
  generateRankings,
  getRankings,
  getReportCard
} from "../controllers/marks.controller.js";

const router = express.Router();

// All routes require auth
router.use(requireAuth);

// Exam Types (admin manages, all can read)
router.get("/exam-types",           listExamTypes);
router.put("/exam-types/:code",     requireRole(["Admin"]), updateExamType);

// Teacher-Subject Assignments
router.get("/assignments",          requireRole(["Admin"]), listAssignments);
router.post("/assignments",         requireRole(["Admin"]), createAssignment);
router.delete("/assignments/:id",   requireRole(["Admin"]), deleteAssignment);

// Subjects (for marks entry — teacher sees own subjects, admin sees all)
router.get("/my-subjects",          requireRole(["Admin", "Teacher"]), getMySubjects);

// Students loader
router.get("/students",             requireRole(["Admin", "Teacher"]), getStudentsForMarks);

// Marks CRUD
router.get("/",                     requireRole(["Admin", "Teacher"]), getMarks);
router.post("/bulk-save",           requireRole(["Admin", "Teacher"]), bulkSaveMarks);

// Result Visibility (Admin only)
router.get("/visibility",           requireRole(["Admin"]), getVisibility);
router.put("/visibility",           requireRole(["Admin"]), updateVisibility);

// Edit logs
router.get("/edit-logs/:marksRecordId", requireRole(["Admin"]), getEditLogs);

// Totals
router.get("/subject-totals",       requireRole(["Admin", "Teacher"]), getSubjectTotals);

// Rankings (admin only for generate; admin & teacher can view)
router.post("/generate-rankings",   requireRole(["Admin"]), generateRankings);
router.get("/rankings",             requireRole(["Admin", "Teacher"]), getRankings);

// Report card
router.get("/report-card/:studentId", requireRole(["Admin", "Teacher"]), getReportCard);

export default router;
