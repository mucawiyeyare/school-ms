import express from "express";
import { getExamTerms, createExamTerm, updateExamTerm, deleteExamTerm } from "../controllers/examTerm.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = express.Router();

router.get("/", requireAuth, getExamTerms);
router.post("/", requireAuth, requireRole(["Admin"]), createExamTerm);
router.put("/:id", requireAuth, requireRole(["Admin"]), updateExamTerm);
router.delete("/:id", requireAuth, requireRole(["Admin"]), deleteExamTerm);

export default router;
