import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Student from "../models/Student.js";
import Announcement from "../models/Announcement.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function signToken(userId, role) {
  return jwt.sign({ sub: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
}

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: "email and password required" });

  const user = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  if (user.status === "inactive") return res.status(403).json({ message: "Account is inactive" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = signToken(user._id.toString(), user.role);
  res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-passwordHash");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

export const updateMyPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "currentPassword and newPassword are required" });
  }

  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return res.status(400).json({ message: "Current password is incorrect" });

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.json({ message: "Password updated successfully" });
});

export const updateMe = asyncHandler(async (req, res) => {
  const { name, phone } = req.body || {};
  const updateData = {};
  
  if (name) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;

  let photoPath = null;
  if (req.file) {
    photoPath = `/uploads/profiles/${req.file.filename}`;
    updateData.avatar = photoPath;
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true, runValidators: true }
  ).select("-passwordHash");

  if (!user) return res.status(404).json({ message: "User not found" });

  // If the user is a Student, sync these changes to their Student model
  if (user.role === "Student") {
    const studentUpdate = {};
    if (name) {
      const parts = name.split(" ");
      studentUpdate.firstName = parts[0] || "";
      studentUpdate.lastName = parts.slice(1).join(" ") || "";
    }
    if (phone !== undefined) {
      studentUpdate.phone = phone;
    }
    if (photoPath) {
      studentUpdate.photo = photoPath;
    }

    if (Object.keys(studentUpdate).length > 0) {
      await Student.findOneAndUpdate(
        { studentUserId: user._id },
        studentUpdate,
        { runValidators: true }
      );
    }
  }

  res.json(user);
});

// Admin-only create user
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body || {};
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "name, email, password, role required" });
  }

  const exists = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (exists) return res.status(409).json({ message: "Email already exists" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: String(name).trim(),
    email: String(email).toLowerCase().trim(),
    passwordHash,
    role,
    phone
  });

  res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone });
});

// Admin: list all users
export const listUsers = asyncHandler(async (req, res) => {
  const { role, status } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (status) filter.status = status;
  const users = await User.find(filter).select("-passwordHash").sort({ createdAt: -1 });
  res.json(users);
});

// Admin: update user
export const updateUser = asyncHandler(async (req, res) => {
  const { name, email, role, phone, status } = req.body || {};
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { ...(name && { name }), ...(email && { email }), ...(role && { role }), ...(phone !== undefined && { phone }), ...(status && { status }) },
    { new: true, runValidators: true }
  ).select("-passwordHash");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

// Admin: delete user
export const deleteUser = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) {
    return res.status(400).json({ message: "Cannot delete your own account" });
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ message: "User deleted" });
});

// Dashboard stats
export const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalStudents,
    totalTeachers,
    totalEnrollments,
    totalAnnouncements
  ] = await Promise.all([
    Student.countDocuments(),
    User.countDocuments({ role: "Teacher" }),
    Student.countDocuments({ status: "active" }),
    Announcement.countDocuments()
  ]);

  res.json({ totalStudents, totalTeachers, totalEnrollments, totalAnnouncements });
});