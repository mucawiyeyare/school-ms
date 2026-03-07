import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
  {
    studentId:      { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    examId:         { type: mongoose.Schema.Types.ObjectId, ref: "Exam" },         // new – preferred
    examTermId:     { type: mongoose.Schema.Types.ObjectId, ref: "ExamTerm" },     // legacy – kept for compat
    subjectId:      { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    classLevelId:   { type: mongoose.Schema.Types.ObjectId, ref: "ClassLevel" },
    sectionId:      { type: mongoose.Schema.Types.ObjectId, ref: "Section" },
    marksObtained:  { type: Number, required: true, min: 0 },
    maxMarks:       { type: Number, required: true, min: 1 },
    passingMarks:   { type: Number, default: 0 },
    grade:          { type: String, trim: true },
    passFail:       { type: String, enum: ["Pass", "Fail"], default: "Fail" },
    rank:           { type: Number },                                               // rank within class for this subject
    remarks:        { type: String, trim: true },
    enteredBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Allow multiple entries if student is in different exams; unique per exam+student+subject
resultSchema.index({ studentId: 1, examId: 1, subjectId: 1 }, { unique: true, sparse: true });
resultSchema.index({ studentId: 1, examTermId: 1, subjectId: 1 }, { unique: true, sparse: true });

// Auto-compute grade and pass/fail before save
resultSchema.pre("save", function (next) {
  const pct = (this.marksObtained / this.maxMarks) * 100;
  if (pct >= 90) this.grade = "A+";
  else if (pct >= 80) this.grade = "A";
  else if (pct >= 70) this.grade = "B";
  else if (pct >= 60) this.grade = "C";
  else if (pct >= 50) this.grade = "D";
  else this.grade = "F";

  this.passFail = this.marksObtained >= this.passingMarks ? "Pass" : "Fail";
  next();
});

export default mongoose.model("Result", resultSchema);
