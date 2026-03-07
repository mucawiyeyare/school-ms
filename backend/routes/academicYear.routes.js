import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import {
  createAcademicYear,
  listAcademicYears,
  activateAcademicYear,
  updateAcademicYear,
  deleteAcademicYear
} from "../controllers/academicYear.controller.js";

const router = Router();

router.get("/", requireAuth, listAcademicYears);
router.post("/", requireAuth, requireRole(["Admin"]), createAcademicYear);
router.patch("/:id/activate", requireAuth, requireRole(["Admin"]), activateAcademicYear);
router.put("/:id", requireAuth, requireRole(["Admin"]), updateAcademicYear);
router.delete("/:id", requireAuth, requireRole(["Admin"]), deleteAcademicYear);

export default router;