import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    classLevelId: { type: mongoose.Schema.Types.ObjectId, ref: "ClassLevel" }, // Optional; many-to-many via ClassSubject junction table
    teacherUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear" },
    description: { type: String, trim: true }
  },
  { timestamps: true }
);

subjectSchema.index({ code: 1 }, { unique: true });

export default mongoose.model("Subject", subjectSchema);
