import mongoose from "mongoose";
import Student from "../models/Student.js";
import Enrollment from "../models/Enrollment.js";
import PromotionLog from "../models/PromotionLog.js";
import RankRecord from "../models/RankRecord.js";
import ClassLevel from "../models/ClassLevel.js";

/**
 * Handle automatic student promotion when transitioning to a new academic year.
 * @param {string} oldYearId - The AcademicYear ID that is being archived.
 * @param {string} newYearId - The AcademicYear ID that is becoming active.
 * @param {string} adminUserId - The User ID of the admin triggering this action.
 */
export async function handleAutomaticPromotion(oldYearId, newYearId, adminUserId) {
  try {
    console.log(`[Auto Promotion] Starting promotion from ${oldYearId} to ${newYearId}...`);

    // 1. Get all enrollments for the old year
    const activeEnrollments = await Enrollment.find({
      academicYearId: oldYearId,
      status: "active"
    }).populate("studentId").populate("classLevelId").populate("sectionId");

    if (activeEnrollments.length === 0) {
      console.log("[Auto Promotion] No active enrollments found in old year. Done.");
      return;
    }

    // 2. Map class levels by order to facilitate finding the "next" class
    const allClassLevels = await ClassLevel.find().sort({ orderNumber: 1 });
    const classOrderByOrder = new Map(allClassLevels.map((cl, i) => [cl.orderNumber, { current: cl, index: i }]));
    
    // 3. Process each student
    for (const enrollment of activeEnrollments) {
      const student = enrollment.studentId;
      if (!student) continue;

      // 4. Determine Pass/Fail from RankRecord (we assume averageScore >= 50 is a Pass)
      // RankRecords are stored per-student, per-year, per-class. We fetch the latest one.
      const rank = await RankRecord.findOne({
        studentId: student._id,
        academicYearId: oldYearId,
        classLevelId: enrollment.classLevelId._id
      });

      let passed = false;
      let reason = "No exam records found (Auto-Fail)";

      if (rank) {
        if (rank.averageScore >= 50) {
          passed = true;
          reason = `Passed with average score: ${rank.averageScore.toFixed(2)}`;
        } else {
          reason = `Failed with average score: ${rank.averageScore.toFixed(2)}`;
        }
      }

      const currentClassInfo = classOrderByOrder.get(enrollment.classLevelId.orderNumber);
      const isCurrentlyHighestClass = currentClassInfo && currentClassInfo.index === allClassLevels.length - 1;

      let nextClassId = enrollment.classLevelId._id;
      let action = "repeated";
      let newStatus = "active";

      if (passed) {
        if (isCurrentlyHighestClass) {
          // Passed highest class -> Graduated
          action = "graduated";
          newStatus = "graduated";
          nextClassId = null; 
        } else {
          // Promote to next class
          const nextClassIndex = currentClassInfo.index + 1;
          nextClassId = allClassLevels[nextClassIndex]._id;
          action = "promoted";
        }
      }

      // If they graduated, update student status and do NOT create a new enrollment
      if (action === "graduated") {
        await Student.findByIdAndUpdate(student._id, {
          status: "graduated",
          academicYearId: newYearId
        });

        await PromotionLog.create({
          studentId: student._id,
          fromAcademicYearId: oldYearId,
          toAcademicYearId: newYearId,
          fromClassLevelId: enrollment.classLevelId._id,
          toClassLevelId: undefined, // Graduated
          action,
          reason,
          performedBy: adminUserId
        });
        
        continue;
      }

      // Otherwise, they are continuing (Promoted or Repeated). 
      // Create new Enrollment for the New Year, preserving the old Enrollment!
      
      // Update the student's current pointer to point to the new year & class.
      // We also map them to the same section name if possible. Otherwise, leave the same section ID.
      // Often, schools just map "Grade 1 Section A" -> "Grade 2 Section A". Using the same sectionId works structurally in SMS.
      const targetSectionId = enrollment.sectionId ? enrollment.sectionId._id : undefined;

      await Student.findByIdAndUpdate(student._id, {
        academicYearId: newYearId,
        classLevelId: nextClassId,
        sectionId: targetSectionId,
        status: newStatus
      });

      // Insert new Enrollment record
      await Enrollment.create({
        studentId: student._id,
        academicYearId: newYearId,
        classLevelId: nextClassId,
        sectionId: targetSectionId,
        rollNo: enrollment.rollNo, // Carry over Roll Number if applicable
        status: "active"
      });

      // Log promotion
      await PromotionLog.create({
        studentId: student._id,
        fromAcademicYearId: oldYearId,
        toAcademicYearId: newYearId,
        fromClassLevelId: enrollment.classLevelId._id,
        toClassLevelId: nextClassId,
        action,
        reason,
        performedBy: adminUserId
      });
    }

    console.log(`[Auto Promotion] Completed smoothly.`);
  } catch (error) {
    console.error(`[Auto Promotion] Critical Error:`, error);
  }
}
