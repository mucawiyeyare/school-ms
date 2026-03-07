/**
 * One-time migration: drop the old non-sparse unique index on results
 * so the new sparse indexes can be created by Mongoose.
 *
 * Run once with:  node migrateResultsIndex.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error("❌  No MONGO_URI found in .env");
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("✅  Connected to MongoDB");

  const db = mongoose.connection.db;
  const col = db.collection("results");

  // List current indexes so we know what to drop
  const indexes = await col.indexes();
  console.log("Current indexes on results collection:");
  indexes.forEach((ix) => console.log(" •", JSON.stringify(ix.key), ix.unique ? "(unique)" : "", ix.sparse ? "(sparse)" : ""));

  // Drop the old non-sparse unique compound index on examTermId
  const OLD_NAME = "studentId_1_examTermId_1_subjectId_1";
  try {
    await col.dropIndex(OLD_NAME);
    console.log(`✅  Dropped old index: ${OLD_NAME}`);
  } catch (e) {
    if (e.codeName === "IndexNotFound") {
      console.log(`ℹ️   Index "${OLD_NAME}" not found – already dropped or never created.`);
    } else {
      throw e;
    }
  }

  // Drop the old examId index if it was created without sparse (edge case)
  const OLD_EXAM_NAME = "studentId_1_examId_1_subjectId_1";
  try {
    await col.dropIndex(OLD_EXAM_NAME);
    console.log(`✅  Dropped old index: ${OLD_EXAM_NAME}`);
  } catch (e) {
    if (e.codeName === "IndexNotFound") {
      console.log(`ℹ️   Index "${OLD_EXAM_NAME}" not found – skipping.`);
    } else {
      throw e;
    }
  }

  // Now re-create both sparse indexes manually so we don't need a restart
  await col.createIndex(
    { studentId: 1, examId: 1, subjectId: 1 },
    { unique: true, sparse: true, name: "studentId_1_examId_1_subjectId_1_sparse" }
  );
  console.log("✅  Created sparse unique index for examId");

  await col.createIndex(
    { studentId: 1, examTermId: 1, subjectId: 1 },
    { unique: true, sparse: true, name: "studentId_1_examTermId_1_subjectId_1_sparse" }
  );
  console.log("✅  Created sparse unique index for examTermId");

  console.log("\n✅  Migration complete. You can now enter marks without duplicate-key errors.");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("❌  Migration failed:", err.message);
  process.exit(1);
});
