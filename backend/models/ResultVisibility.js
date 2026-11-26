import mongoose from "mongoose";

const resultVisibilitySchema = new mongoose.Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
    },
    classLevelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassLevel",
      required: true,
    },
    examTypeCode: {
      type: String,
      required: true,
      enum: ["monthly1", "midterm", "monthly2", "final"],
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Ensure one visibility setting per (year + class + exam pattern)
resultVisibilitySchema.index(
  { academicYearId: 1, classLevelId: 1, examTypeCode: 1 },
  { unique: true }
);

export default mongoose.model("ResultVisibility", resultVisibilitySchema);
