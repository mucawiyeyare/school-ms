import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    studentUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    emisNumber:    { type: String, trim: true, unique: true, sparse: true },
    rollNumber:    { type: String, trim: true, unique: true, sparse: true },
    firstName:     { type: String, required: true, trim: true },
    lastName:      { type: String, required: true, trim: true },
    gender:        { type: String, enum: ["Male", "Female", "Other"], required: true },
    dateOfBirth:   { type: Date },
    phone:         { type: String, trim: true },
    address:       { type: String, trim: true },
    photo:         { type: String, trim: true },   // file path served statically

    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear" },
    classLevelId:   { type: mongoose.Schema.Types.ObjectId, ref: "ClassLevel" },
    sectionId:      { type: mongoose.Schema.Types.ObjectId, ref: "Section" },

    admissionDate: { type: Date, default: Date.now },
    status:        { type: String, enum: ["active", "transferred", "graduated", "dropped", "suspended", "expelled"], default: "active" },

    guardianName:           { type: String, trim: true },
    guardianPhone:          { type: String, trim: true },
    emergencyContactName:   { type: String, trim: true },
    emergencyContactPhone:  { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("Student", studentSchema);