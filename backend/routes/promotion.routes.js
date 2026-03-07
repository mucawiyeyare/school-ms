import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { previewPromotions, executePromotions } from "../controllers/promotion.controller.js";

const router = Router();

router.post("/preview", requireAuth, requireRole(["Admin"]), previewPromotions);
router.post("/execute", requireAuth, requireRole(["Admin"]), executePromotions);

export default router;