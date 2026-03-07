import mongoose from "mongoose";

const marksRecordSchema = new mongoose.Schema(
  {
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear", required: true },
    classLevelId:   { type: mongoose.Schema.Types.ObjectId, ref: "ClassLevel",   required: true },
    sectionId:      { type: mongoose.Schema.Types.ObjectId, ref: "Section",      required: true },
    subjectId:      { type: mongoose.Schema.Types.ObjectId, ref: "Subject",      required: true },
    studentId:      { type: mongoose.Schema.Types.ObjectId, ref: "Student",      required: true },
    examTypeCode:   { type: String, required: true, enum: ["monthly1", "midterm", "monthly2", "final"] },
    marks:          { type: Number, required: true, min: 0 },
    enteredBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

// Unique constraint: one marks record per student + subject + year + examType
marksRecordSchema.index(
  { studentId: 1, subjectId: 1, academicYearId: 1, examTypeCode: 1 },
  { unique: true }
);

export default mongoose.model("MarksRecord", marksRecordSchema);
