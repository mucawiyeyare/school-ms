import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcrypt";

import { connectDB } from "./db/db.js";
import User from "./models/User.js";
import AcademicYear from "./models/AcademicYear.js";
import ClassLevel from "./models/ClassLevel.js";
import Section from "./models/Section.js";

async function seed() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("❌ MONGO_URI missing in .env");
    }

    await connectDB(process.env.MONGO_URI);

    console.log("🌱 Starting seed...");

    // =========================
    // 1️⃣ ADMIN (CREATE OR RESET PASSWORD)
    // =========================
    const adminEmail = "abdi3@gmail.com";
    const adminPassword = "123456"; // change if you want
    const adminName = "abdi";

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      admin = await User.create({
        name: adminName,
        email: adminEmail,
        passwordHash,
        role: "Admin"
      });

      console.log("✅ Admin created:");
    } else {
      admin.name = adminName;
      admin.passwordHash = passwordHash; // FORCE RESET
      admin.role = "Admin";
      await admin.save();

      console.log("✅ Admin password reset:");
    }

    console.log({
      email: adminEmail,
      password: adminPassword
    });

    // =========================
    // 2️⃣ ACADEMIC YEAR
    // =========================
    const yearName = "2025/2026";

    let year = await AcademicYear.findOne({ name: yearName });

    if (!year) {
      year = await AcademicYear.create({
        name: yearName,
        startDate: new Date("2025-09-01"),
        endDate: new Date("2026-06-30"),
        status: "archived"
      });

      console.log("✅ Academic year created:", yearName);
    }

    // Activate it (only one active)
    await AcademicYear.updateMany(
      { _id: { $ne: year._id } },
      { $set: { status: "archived" } }
    );

    year.status = "active";
    await year.save();

    console.log("✅ Academic year activated:", yearName);

    // =========================
    // 3️⃣ CLASSES
    // =========================
    const classes = [
      { name: "Grade 1", orderNumber: 1 },
      { name: "Grade 2", orderNumber: 2 },
      { name: "Grade 3", orderNumber: 3 }
    ];

    for (const c of classes) {
      const exists = await ClassLevel.findOne({ orderNumber: c.orderNumber });
      if (!exists) {
        await ClassLevel.create(c);
        console.log("✅ Class created:", c.name);
      }
    }

    // =========================
    // 4️⃣ SECTIONS (A & B)
    // =========================
    const classLevels = await ClassLevel.find();

    for (const cl of classLevels) {
      for (const sectionName of ["A", "B"]) {
        const existsSection = await Section.findOne({
          classLevelId: cl._id,
          name: sectionName
        });

        if (!existsSection) {
          await Section.create({
            classLevelId: cl._id,
            name: sectionName
          });

          console.log(`✅ Section created: ${cl.name} - ${sectionName}`);
        }
      }
    }

    console.log("\n🎉 Seed completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

seed();