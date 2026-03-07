import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import {
  createClassLevel,
  listClassLevels,
  updateClassLevel,
  deleteClassLevel,
  getClassSubjects,
  setClassSubjects,
} from "../controllers/class.controller.js";

const router = Router();

// ── Class CRUD ────────────────────────────────────────────────────────────
router.get("/", requireAuth, listClassLevels);
router.post("/", requireAuth, requireRole(["Admin"]), createClassLevel);
router.put("/:id", requireAuth, requireRole(["Admin"]), updateClassLevel);
router.delete("/:id", requireAuth, requireRole(["Admin"]), deleteClassLevel);

// ── Class ↔ Subject Assignments ───────────────────────────────────────────
router.get("/:id/subjects", requireAuth, getClassSubjects);
router.post("/:id/subjects", requireAuth, requireRole(["Admin"]), setClassSubjects);

export default router;