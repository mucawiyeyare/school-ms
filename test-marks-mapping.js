import mongoose from "mongoose";
import MarksRecord from "./backend/models/MarksRecord.js";
import Student from "./backend/models/Student.js";
import User from "./backend/models/User.js";

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/school_sms');
  console.log("Connected to DB.");

  // Get first student user
  const user = await User.findOne({ role: "Student" });
  if (!user) {
    console.log("No student users found.");
    process.exit(0);
  }
  
  console.log("Found Student User:", user.email);
  
  const student = await Student.findOne({ studentUserId: user._id });
  if (!student) {
    console.log("No student profile found for this user.");
    process.exit(0);
  }

  console.log("Student Profile ID:", student._id);

  const marks = await MarksRecord.find({ studentId: student._id });
  console.log("MarksRecords for student count:", marks.length);
  
  if (marks.length === 0) {
      // Find ANY marks to see what studentId they use
      const anyMarks = await MarksRecord.find().limit(3);
      console.log("Sample Marks found in DB:", anyMarks.length);
      if (anyMarks.length > 0) {
          console.log("Marks student ID:", anyMarks[0].studentId);
          console.log("Actual Student ID:", student._id);
      }
  }

  process.exit(0);
}

run().catch(console.error);
