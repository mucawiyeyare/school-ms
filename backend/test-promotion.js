import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AcademicYear from './models/AcademicYear.js';
import User from './models/User.js';
import Student from './models/Student.js';
import Enrollment from './models/Enrollment.js';
import ClassLevel from './models/ClassLevel.js';
import RankRecord from './models/RankRecord.js';
import { handleAutomaticPromotion } from './utils/promotion.util.js';

dotenv.config();

async function testPromotion() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const admin = await User.findOne({ role: 'Admin' });
  
  // Cleanup any left over from previous failed run
  await ClassLevel.deleteMany({ orderNumber: { $in: [991, 992, 993] } });
  await User.deleteMany({ email: { $in: ['passauto@t.c', 'failauto@t.c', 'gradauto@t.c'] } });
  await AcademicYear.deleteMany({ name: { $in: ['Old Year', 'New Year'] } });

  const oldYear = await AcademicYear.create({ name: 'Old Year', startDate: new Date('2023-01-01'), endDate: new Date('2023-12-31'), status: 'active' });
  const newYear = await AcademicYear.create({ name: 'New Year', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), status: 'archived' });
  
  const class1 = await ClassLevel.create({ name: 'Class 1 Auto', orderNumber: 991 });
  const class2 = await ClassLevel.create({ name: 'Class 2 Auto', orderNumber: 992 });
  const class3 = await ClassLevel.create({ name: 'Class 3 Auto (Final)', orderNumber: 993 });

  const u1 = await User.create({ name: 'Student Passing', email: 'passauto@t.c', passwordHash: 'x', role: 'Student' });
  const u2 = await User.create({ name: 'Student Failing', email: 'failauto@t.c', passwordHash: 'x', role: 'Student' });
  const u3 = await User.create({ name: 'Student Grad', email: 'gradauto@t.c', passwordHash: 'x', role: 'Student' });

  const s1 = await Student.create({ studentUserId: u1._id, firstName: 'Pass', lastName: 'Ing', gender: 'Male', academicYearId: oldYear._id, classLevelId: class1._id, status: 'active' });
  const s2 = await Student.create({ studentUserId: u2._id, firstName: 'Fail', lastName: 'Ing', gender: 'Female', academicYearId: oldYear._id, classLevelId: class1._id, status: 'active' });
  const s3 = await Student.create({ studentUserId: u3._id, firstName: 'Grad', lastName: 'Uate', gender: 'Female', academicYearId: oldYear._id, classLevelId: class3._id, status: 'active' });

  await Enrollment.create({ studentId: s1._id, academicYearId: oldYear._id, classLevelId: class1._id, status: 'active' });
  await Enrollment.create({ studentId: s2._id, academicYearId: oldYear._id, classLevelId: class1._id, status: 'active' });
  await Enrollment.create({ studentId: s3._id, academicYearId: oldYear._id, classLevelId: class3._id, status: 'active' });

  await RankRecord.create({ academicYearId: oldYear._id, classLevelId: class1._id, sectionId: s1._id /*dummy*/, studentId: s1._id, totalScore: 80, averageScore: 80, position: 1, generatedBy: admin._id });
  await RankRecord.create({ academicYearId: oldYear._id, classLevelId: class1._id, sectionId: s2._id /*dummy*/, studentId: s2._id, totalScore: 30, averageScore: 30, position: 2, generatedBy: admin._id });
  await RankRecord.create({ academicYearId: oldYear._id, classLevelId: class3._id, sectionId: s3._id /*dummy*/, studentId: s3._id, totalScore: 90, averageScore: 90, position: 1, generatedBy: admin._id });

  console.log('Running auto promotion...');
  await handleAutomaticPromotion(oldYear._id, newYear._id, admin._id);
  
  const e1 = await Enrollment.findOne({ studentId: s1._id, academicYearId: newYear._id }).populate('classLevelId');
  const e2 = await Enrollment.findOne({ studentId: s2._id, academicYearId: newYear._id }).populate('classLevelId');
  const e3 = await Enrollment.findOne({ studentId: s3._id, academicYearId: newYear._id }).populate('classLevelId');
  
  const stu1 = await Student.findById(s1._id).populate('classLevelId');
  const stu2 = await Student.findById(s2._id).populate('classLevelId');
  const stu3 = await Student.findById(s3._id);

  console.log('--- Results ---');
  console.log('Passing Student (Class 1 -> Class 2):');
  console.log('  New Enrollment Class:', e1 ? e1.classLevelId.name : 'Missing');
  console.log('  Student Status:', stu1.status, '| Current Class:', stu1.classLevelId.name);
  
  console.log('Failing Student (Class 1 -> Class 1):');
  console.log('  New Enrollment Class:', e2 ? e2.classLevelId.name : 'Missing');
  console.log('  Student Status:', stu2.status, '| Current Class:', stu2.classLevelId.name);

  console.log('Graduating Student (Class 3 -> None):');
  console.log('  New Enrollment Class:', e3 ? e3.classLevelId.name : 'No Enrollment (Correct!)');
  console.log('  Student Status:', stu3.status);

  // Cleanup
  await RankRecord.deleteMany({ academicYearId: oldYear._id });
  await Enrollment.deleteMany({ academicYearId: { $in: [oldYear._id, newYear._id] } });
  await Student.deleteMany({ _id: { $in: [s1._id, s2._id, s3._id] } });
  await User.deleteMany({ _id: { $in: [u1._id, u2._id, u3._id] } });
  await AcademicYear.deleteMany({ _id: { $in: [oldYear._id, newYear._id] } });
  await ClassLevel.deleteMany({ _id: { $in: [class1._id, class2._id, class3._id] } });
  
  console.log('Done.');
  process.exit(0);
}

testPromotion().catch(console.error);
