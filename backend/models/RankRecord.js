import mongoose from "mongoose";

const rankRecordSchema = new mongoose.Schema(
  {
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear", required: true },
    classLevelId:   { type: mongoose.Schema.Types.ObjectId, ref: "ClassLevel",   required: true },
    sectionId:      { type: mongoose.Schema.Types.ObjectId, ref: "Section",      required: true },
    studentId:      { type: mongoose.Schema.Types.ObjectId, ref: "Student",      required: true },
    totalScore:     { type: Number, required: true },
    averageScore:   { type: Number, required: true },
    position:       { type: Number, required: true },
    generatedAt:    { type: Date, default: Date.now },
    generatedBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

// Unique per student per academic year + class + section (one ranking set at a time)
rankRecordSchema.index(
  { academicYearId: 1, classLevelId: 1, sectionId: 1, studentId: 1 },
  { unique: true }
);

export default mongoose.model("RankRecord", rankRecordSchema);
