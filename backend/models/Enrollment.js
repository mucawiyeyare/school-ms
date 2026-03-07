import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear", required: true },
    classLevelId: { type: mongoose.Schema.Types.ObjectId, ref: "ClassLevel", required: true },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true },
    rollNo: { type: String, trim: true },
    status: {
      type: String,
      enum: ["active", "transferred", "graduated", "dropped"],
      default: "active"
    }
  },
  { timestamps: true }
);

// One enrollment per student per academic year
enrollmentSchema.index({ studentId: 1, academicYearId: 1 }, { unique: true });

export default mongoose.model("Enrollment", enrollmentSchema);