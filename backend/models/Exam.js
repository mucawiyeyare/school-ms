import mongoose from "mongoose";

/**
 * Exam model – represents a single exam event (Midterm, Final, Monthly Test, Quiz …)
 * Each exam belongs to one academic year and one term/semester.
 */
const examSchema = new mongoose.Schema(
  {
    name:           { type: String, required: true, trim: true },   // e.g. "Midterm 2025"
    type:           { type: String, enum: ["Midterm", "Final", "Monthly Test", "Quiz", "Other"], default: "Other" },
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear", required: true },
    term:           { type: String, trim: true },                    // e.g. "Term 1", "Semester A"
    startDate:      { type: Date },
    endDate:        { type: Date },
    description:    { type: String, trim: true },
    status:         { type: String, enum: ["draft", "ongoing", "completed", "published"], default: "draft" },
    publishedAt:    { type: Date },
    publishedBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Exam", examSchema);
