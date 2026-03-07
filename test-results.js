import mongoose from "mongoose";
import Result from "./backend/models/Result.js";
import Exam from "./backend/models/Exam.js";

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/school_sms');
  console.log("Connected to DB.");

  const publishedExams = await Exam.find({ status: "published" }).select("_id");
  console.log("Published exams:", publishedExams.length);

  const filter = { examId: { $in: publishedExams.map(e => e._id) } };

  const results = await Result.find(filter)
    .populate("studentId", "firstName lastName")
    .populate("examId", "name type status")
    .populate("classLevelId", "name");

  console.log("Total published results:", results.length);
  if (results.length > 0) {
      console.log("First result classLevelId:", results[0].classLevelId);
      console.log("First result examId:", results[0].examId);
  }

  process.exit(0);
}

run().catch(console.error);
