import mongoose from "mongoose";

/**
 * Junction table: many-to-many relationship between ClassLevel and Subject.
 * A class can have multiple subjects; a subject can belong to multiple classes.
 */
const classSubjectSchema = new mongoose.Schema(
  {
    classLevelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassLevel",
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
  },
  { timestamps: true }
);

// Compound unique index prevents duplicate assignments
classSubjectSchema.index({ classLevelId: 1, subjectId: 1 }, { unique: true });

export default mongoose.model("ClassSubject", classSubjectSchema);
