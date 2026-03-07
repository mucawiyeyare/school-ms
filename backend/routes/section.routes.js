import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import {
  createSection,
  listSections,
  updateSection,
  deleteSection
} from "../controllers/section.controller.js";

const router = Router();

router.get("/", requireAuth, listSections);
router.post("/", requireAuth, requireRole(["Admin"]), createSection);
router.put("/:id", requireAuth, requireRole(["Admin"]), updateSection);
router.delete("/:id", requireAuth, requireRole(["Admin"]), deleteSection);

export default router;