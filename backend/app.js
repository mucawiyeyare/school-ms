import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { errorHandler, notFound } from "./middleware/error.js";

import authRoutes from "./routes/auth.routes.js";
import academicYearRoutes from "./routes/academicYear.routes.js";
import classRoutes from "./routes/class.routes.js";
import sectionRoutes from "./routes/section.routes.js";
import studentRoutes from "./routes/student.routes.js";
import promotionRoutes from "./routes/promotion.routes.js";
import subjectRoutes from "./routes/subject.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import examTermRoutes from "./routes/examTerm.routes.js";
import resultRoutes from "./routes/result.routes.js";
import announcementRoutes from "./routes/announcement.routes.js";
import feeRoutes from "./routes/fee.routes.js";
import teacherRoutes from "./routes/teacher.routes.js";
import examRoutes from "./routes/exam.routes.js";
import marksRoutes from "./routes/marks.routes.js";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://127.0.0.1:5173"],
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/academic-years", academicYearRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/exam-terms", examTermRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/marks", marksRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;