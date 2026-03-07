import express from "express";
import { getSubjects, createSubject, updateSubject, deleteSubject } from "../controllers/subject.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = express.Router();

router.get("/", requireAuth, getSubjects);
router.post("/", requireAuth, requireRole(["Admin"]), createSubject);
router.put("/:id", requireAuth, requireRole(["Admin"]), updateSubject);
router.delete("/:id", requireAuth, requireRole(["Admin"]), deleteSubject);

export default router;
