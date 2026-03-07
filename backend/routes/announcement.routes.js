import express from "express";
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from "../controllers/announcement.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = express.Router();

router.get("/", requireAuth, getAnnouncements);
router.post("/", requireAuth, requireRole(["Admin", "Teacher"]), createAnnouncement);
router.delete("/:id", requireAuth, requireRole(["Admin"]), deleteAnnouncement);

export default router;
