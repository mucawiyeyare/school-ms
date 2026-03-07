/**
 * seedExamTypes.js
 * Run once to insert the 4 default exam types.
 * Usage: node seedExamTypes.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import ExamType from "./models/ExamType.js";

dotenv.config();

const DEFAULTS = [
  { code: "monthly1", label: "Monthly 1",  maxMarks: 20, isEnabled: true, order: 1 },
  { code: "midterm",  label: "Midterm",     maxMarks: 30, isEnabled: true, order: 2 },
  { code: "monthly2", label: "Monthly 2",  maxMarks: 20, isEnabled: true, order: 3 },
  { code: "final",    label: "Final",       maxMarks: 30, isEnabled: true, order: 4 },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  for (const et of DEFAULTS) {
    await ExamType.findOneAndUpdate(
      { code: et.code },
      { $setOnInsert: et },
      { upsert: true }
    );
  }
  console.log("✅ Exam types seeded.");
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
