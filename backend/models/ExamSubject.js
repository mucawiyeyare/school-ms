import mongoose from "mongoose";

/**
 * ExamSubject – defines the subject schedule within an exam for a particular class.
 * Stores total marks, passing marks, exam date, and duration per subject-class combo.
 */
const examSubjectSchema = new mongoose.Schema(
  {
    examId:        { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    subjectId:     { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    classLevelId:  { type: mongoose.Schema.Types.ObjectId, ref: "ClassLevel", required: true },
    sectionId:     { type: mongoose.Schema.Types.ObjectId, ref: "Section" },        // optional – null = all sections
    totalMarks:    { type: Number, required: true, min: 1, default: 100 },
    passingMarks:  { type: Number, required: true, min: 0, default: 40 },
    examDate:      { type: Date },
    durationMins:  { type: Number, min: 1 },                                        // exam duration in minutes
  },
  { timestamps: true }
);

// One subject per exam per class (optionally per section)
examSubjectSchema.index({ examId: 1, subjectId: 1, classLevelId: 1 }, { unique: true });

export default mongoose.model("ExamSubject", examSubjectSchema);
