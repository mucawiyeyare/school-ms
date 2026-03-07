import mongoose from "mongoose";

const teacherSubjectAssignmentSchema = new mongoose.Schema(
  {
    teacherId:      { type: mongoose.Schema.Types.ObjectId, ref: "User",         required: true },
    subjectId:      { type: mongoose.Schema.Types.ObjectId, ref: "Subject",      required: true },
    classLevelId:   { type: mongoose.Schema.Types.ObjectId, ref: "ClassLevel",   required: true },
    sectionId:      { type: mongoose.Schema.Types.ObjectId, ref: "Section" },
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear" }
  },
  { timestamps: true }
);

// Prevent duplicate assignments
teacherSubjectAssignmentSchema.index(
  { teacherId: 1, subjectId: 1, classLevelId: 1, sectionId: 1, academicYearId: 1 },
  { unique: true, sparse: true }
);

export default mongoose.model("TeacherSubjectAssignment", teacherSubjectAssignmentSchema);
