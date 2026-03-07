import express from "express";
import {
  getFeeStructures, createFeeStructure, updateFeeStructure, deleteFeeStructure,
  getPayments, recordPayment, deletePayment
} from "../controllers/fee.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = express.Router();

// Fee Structures
router.get("/structures", requireAuth, getFeeStructures);
router.post("/structures", requireAuth, requireRole(["Admin"]), createFeeStructure);
router.put("/structures/:id", requireAuth, requireRole(["Admin"]), updateFeeStructure);
router.delete("/structures/:id", requireAuth, requireRole(["Admin"]), deleteFeeStructure);

// Payments
router.get("/payments", requireAuth, getPayments);
router.post("/payments", requireAuth, requireRole(["Admin"]), recordPayment);
router.delete("/payments/:id", requireAuth, requireRole(["Admin"]), deletePayment);

export default router;
