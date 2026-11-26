import { Router } from "express";
import { login, register, listUsers, updateUser, deleteUser, getDashboardStats, getMe, updateMyPassword, updateMe } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { uploadProfilePhoto } from "../middleware/upload.js";

const router = Router();

router.post("/login", login);
router.post("/register", requireAuth, requireRole(["Admin"]), register);

// User self-service
router.get("/me", requireAuth, getMe);
router.put("/me", requireAuth, uploadProfilePhoto, updateMe);
router.put("/me/password", requireAuth, updateMyPassword);

// User management  
router.get("/users", requireAuth, requireRole(["Admin"]), listUsers);
router.patch("/users/:id", requireAuth, requireRole(["Admin"]), updateUser);
router.delete("/users/:id", requireAuth, requireRole(["Admin"]), deleteUser);

// Dashboard stats
router.get("/dashboard-stats", requireAuth, getDashboardStats);

export default router;