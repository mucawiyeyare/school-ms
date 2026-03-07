import express from "express";
import {
  getExams, getExamById, createExam, updateExam, deleteExam,
  publishExam, unpublishExam,
  getExamSubjects, upsertExamSubject, deleteExamSubject,
  bulkUpsertMarks, getResults, getReportCard, getClassResultSheet,
} from "../controllers/exam.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = express.Router();

/* ── Exams ── */
router.get("/",                   requireAuth, getExams);
router.get("/:id",                requireAuth, getExamById);
router.post("/",                  requireAuth, requireRole(["Admin"]), createExam);
router.put("/:id",                requireAuth, requireRole(["Admin"]), updateExam);
router.delete("/:id",             requireAuth, requireRole(["Admin"]), deleteExam);
router.patch("/:id/publish",      requireAuth, requireRole(["Admin"]), publishExam);
router.patch("/:id/unpublish",    requireAuth, requireRole(["Admin"]), unpublishExam);

/* ── Exam Subjects ── */
router.get("/subjects/list",      requireAuth, getExamSubjects);
router.post("/subjects",          requireAuth, requireRole(["Admin"]), upsertExamSubject);
router.delete("/subjects/:id",    requireAuth, requireRole(["Admin"]), deleteExamSubject);

/* ── Marks & Results ── */
router.post("/marks/bulk",        requireAuth, requireRole(["Admin", "Teacher"]), bulkUpsertMarks);
router.get("/results/list",       requireAuth, getResults);
router.get("/results/report-card/:studentId/:examId", requireAuth, getReportCard);
router.get("/results/class-sheet", requireAuth, getClassResultSheet);

export default router;
