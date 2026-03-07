// server.js
import dotenv from "dotenv";
dotenv.config({ override: true }); // optional, helps when vars already exist

import app from "./app.js";
import { connectDB } from "./db/db.js";

const PORT = Number(process.env.PORT) || 5000;

async function start() {
  // Helpful debug (remove later)
  if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
    console.log("Loaded env keys:", Object.keys(process.env).length);
    console.log("MONGO_URI:", process.env.MONGO_URI);
    console.log("JWT_SECRET exists?:", !!process.env.JWT_SECRET);
  }

  if (!process.env.MONGO_URI) {
    throw new Error(
      "MONGO_URI missing. Make sure .env is inside backend/ and named exactly '.env' (not .env.txt)."
    );
  }

  if (!process.env.JWT_SECRET) {
    throw new Error(
      "JWT_SECRET missing. Add JWT_SECRET=... in your .env file."
    );
  }

  await connectDB(process.env.MONGO_URI);

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Startup error:", err.message);
  process.exit(1);
});