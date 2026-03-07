import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { auth } from "./lib/auth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AcademicYears from "./pages/AcademicYears";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import StudentLayout from "./components/StudentLayout";
import ClassesSections from "./pages/ClassesSections";
import Students from "./pages/Students";
import StudentHistory from "./pages/StudentHistory";
import Promotions from "./pages/Promotions";
import Users from "./pages/Users";
import Subjects from "./pages/Subjects";
import Teachers from "./pages/Teachers";
import AttendancePage from "./pages/AttendancePage";
import ExamPage from "./pages/ExamPage";
import Announcements from "./pages/Announcements";
import Fees from "./pages/Fees";
import Reports from "./pages/Reports";
import StudentRegister from "./pages/StudentRegister";
import AdminStudentProfile from "./pages/AdminStudentProfile";
import MyProfile from "./pages/MyProfile";
import MarksEntry from "./pages/MarksEntry";
import Rankings from "./pages/Rankings";
import ExamTypeSettings from "./pages/ExamTypeSettings";
import TeacherAssignments from "./pages/TeacherAssignments";

// Student sub-pages
import StudentHome from "./pages/student/StudentHome";
import StudentProfilePage from "./pages/student/StudentProfilePage";
import StudentExams from "./pages/student/StudentExams";
import StudentAttendancePage from "./pages/student/StudentAttendancePage";
import StudentFeesPage from "./pages/student/StudentFeesPage";
import StudentHistoryPage from "./pages/student/StudentHistoryPage";

function RootRedirect() {
  const token = auth.getToken();
  const user = auth.getUser();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role === "Student") return <Navigate to="/student/home" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />

        {/* ── Admin / Teacher / Parent routes ── */}
        <Route
          element={
            <ProtectedRoute allowedRoles={["Admin", "Teacher", "Parent"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/academic-years" element={<AcademicYears />} />
          <Route path="/classes" element={<ClassesSections />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/students" element={<Students />} />
          <Route path="/students/register" element={<StudentRegister />} />
          <Route path="/students/:id" element={<AdminStudentProfile />} />
          <Route path="/students/:id/history" element={<AdminStudentProfile />} />
          <Route path="/promotions" element={<Promotions />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/results" element={<ExamPage />} />
          <Route path="/exams" element={<ExamPage />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/fees" element={<Fees />} />
          <Route path="/users" element={<Users />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/profile" element={<MyProfile />} />
          {/* Marks module */}
          <Route path="/marks/entry" element={<MarksEntry />} />
          <Route path="/marks/rankings" element={<Rankings />} />
          <Route path="/marks/exam-types" element={<ExamTypeSettings />} />
          <Route path="/marks/assignments" element={<TeacherAssignments />} />
        </Route>

        {/* ── Student portal ── */}
        <Route
          element={
            <ProtectedRoute allowedRoles={["Student"]}>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/student/home" element={<StudentHome />} />
          <Route path="/student/profile" element={<StudentProfilePage />} />
          <Route path="/student/exams" element={<StudentExams />} />
          <Route path="/student/attendance" element={<StudentAttendancePage />} />
          <Route path="/student/fees" element={<StudentFeesPage />} />
          <Route path="/student/history" element={<StudentHistoryPage />} />
          {/* Legacy redirect */}
          <Route path="/my-profile" element={<Navigate to="/student/profile" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}