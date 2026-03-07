import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { auth } from "../lib/auth";

function StatCard({ label, value, icon, color, iconBg, badge, badgeBg }) {
  return (
    <div className="stat-card animate-fade">
      <div className="stat-icon" style={{ background: iconBg }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <div className="stat-value" style={{ color }}>
          {value ?? <span className="skeleton" style={{ display: "inline-block", width: 48, height: 32 }} />}
        </div>
        <div className="stat-label">{label}</div>
        {badge && <div className="stat-badge" style={{ background: badgeBg || iconBg, color }}>{badge}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const user = auth.getUser();
  const isTeacher = user?.role === "Teacher";

  useEffect(() => {
    api.get("/api/auth/dashboard-stats").then((r) => setStats(r.data)).catch(() => {});
    if (user?.role === "Teacher") {
      api.get("/api/subjects").then((r) => setTeacherSubjects(r.data || [])).catch(() => {});
    }
  }, [user?.role]);

  const cards = [
    {
      label: "Total Students",
      value: stats?.totalStudents,
      color: "#4f46e5",
      iconBg: "#eef2ff",
      badge: "Active",
      badgeBg: "#e8f0ff",
      icon: <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20 }}><path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm-8 9a8 8 0 1 1 16 0H4Z"/></svg>,
    },
    {
      label: "Active Enrollments",
      value: stats?.totalEnrollments,
      color: "#059669",
      iconBg: "#d1fae5",
      badge: "This Year",
      badgeBg: "#dcfce7",
      roles: ["Admin"],
      icon: <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20 }}><path d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H9l-6 2V6a2 2 0 0 1 2-2Zm3 4v2h8V8H8Zm0 4v2h6v-2H8Z"/></svg>,
    },
    {
      label: "Teachers",
      value: stats?.totalTeachers,
      color: "#7c3aed",
      iconBg: "#ede9fe",
      badge: "Staff",
      badgeBg: "#f1eaff",
      roles: ["Admin"],
      icon: <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20 }}><path d="M17 10a5 5 0 1 0-10 0 5 5 0 0 0 10 0ZM3 21a9 9 0 0 1 18 0H3Z"/></svg>,
    },
    {
      label: "Announcements",
      value: stats?.totalAnnouncements,
      color: "#d97706",
      iconBg: "#fef3c7",
      badge: "Posted",
      badgeBg: "#fff2d6",
      icon: <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20 }}><path d="M3 8v8h2l4 4h2V4H9L5 8H3Zm14-2a7 7 0 0 1 0 12v-2a5 5 0 0 0 0-8V6Z"/></svg>,
    },
  ];

  const quickActions = [
    {
      label: "New Student",
      href: "/students",
      color: "#4f46e5",
      bg: "#eef2ff",
      icon: <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20 }}><path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm-8 9a8 8 0 1 1 16 0H4Z"/></svg>,
    },
    {
      label: "Take Attendance",
      href: "/attendance",
      color: "#059669",
      bg: "#d1fae5",
      icon: <svg viewBox="0 0 24 24" fill="none" style={{ width: 20 }}><path d="m9 12 2 2 4-4M3 12a9 9 0 1 0 18 0A9 9 0 0 0 3 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    },
    {
      label: "Enter Results",
      href: "/results",
      color: "#7c3aed",
      bg: "#ede9fe",
      icon: <svg viewBox="0 0 24 24" fill="none" style={{ width: 20 }}><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    },
    {
      label: "Manage Fees",
      href: "/fees",
      roles: ["Admin"],
      color: "#d97706",
      bg: "#fef3c7",
      icon: <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20 }}><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm-1 14v-2H9v-2h2v-1H9V9h2V7h2v2h2v2h-3v1h3v2h-2v2h-2Z"/></svg>,
    },
    {
      label: "Promote Students",
      href: "/promotions",
      roles: ["Admin"],
      color: "#0f766e",
      bg: "#ccfbf1",
      icon: <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20 }}><path d="m6.5 17.5 1.5-1.5L11 19V9h2v10l3-3 1.5 1.5L12 22l-5.5-4.5Z"/></svg>,
    },
    {
      label: "Add User",
      href: "/users",
      roles: ["Admin"],
      color: "#dc2626",
      bg: "#fee2e2",
      icon: <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20 }}><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z"/></svg>,
    },
  ];

  const firstName = user?.name?.split(" ")[0] || "Admin";

  return (
    <div className="dashboard-shell">
      <section className="dashboard-hero animate-fade">
        <div className="dashboard-hero-orb orb-a" />
        <div className="dashboard-hero-orb orb-b" />
        <div className="dashboard-hero-content">
          <div className="dashboard-brand">
            <div className="dashboard-brand-icon">
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 24, height: 24, color: "#f59e0b" }}>
                <path d="M12 2 2 7l10 5 10-5-10-5Zm0 8L5 6.5V12c0 3.4 2.9 6 7 6s7-2.6 7-6V6.5L12 10Z"/>
              </svg>
            </div>
            <div className="dashboard-brand-text">School Management System</div>
          </div>

          <h1 className="dashboard-title">Welcome back, {firstName}</h1>
          <p className="dashboard-subtitle">Here is what is happening in your school today.</p>

          <div className="dashboard-actions">
            <a href="/students" className="btn btn-primary btn-sm">
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 14 }}><path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm-8 9a8 8 0 1 1 16 0H4Z"/></svg>
              Manage Students
            </a>
            <a href="/announcements" className="btn btn-secondary btn-sm">
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 14 }}><path d="M3 8v8h2l4 4h2V4H9L5 8H3Zm14-2a7 7 0 0 1 0 12v-2a5 5 0 0 0 0-8V6Z"/></svg>
              Post Announcement
            </a>
          </div>
        </div>
      </section>

      <div className="stat-grid dashboard-stats">
        {cards.filter((c) => !c.roles || c.roles.includes(user?.role || "Admin")).map((card) => <StatCard key={card.label} {...card} />)}
      </div>

      <div className="card animate-fade">
        <div className="card-header">
          <div>
            <div className="card-title">Quick Actions</div>
            <div className="card-subtitle">Common tasks to get you started</div>
          </div>
        </div>
        <div className="card-body">
          <div className="dashboard-quick-grid">
            {quickActions
              .filter((action) => !action.roles || action.roles.includes(user?.role || "Admin"))
              .map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  className="dashboard-quick-action"
                  style={{ "--quick-color": action.color, "--quick-bg": action.bg }}
                >
                  <div className="dashboard-quick-icon">{action.icon}</div>
                  <span>{action.label}</span>
                </a>
              ))}
          </div>
        </div>
      </div>

      {isTeacher && (
        <div className="card animate-fade" style={{ marginTop: 24 }}>
          <div className="card-header">
            <div>
              <div className="card-title">My Assigned Subjects</div>
              <div className="card-subtitle">Subjects you are currently teaching</div>
            </div>
          </div>
          <div className="card-body">
            {teacherSubjects.length === 0 ? (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none"><path d="M12 2 2 7v10l10 5 10-5V7L12 2Z" stroke="currentColor" strokeWidth="2"/></svg>
                <h3>No subjects assigned</h3>
                <p>You have not been assigned to any subjects yet.</p>
              </div>
            ) : (
              <div className="stat-grid">
                {teacherSubjects.map((sub) => (
                  <div key={sub._id} className="teacher-subject-card">
                    <div className="teacher-subject-code">{sub.code}</div>
                    <div className="teacher-subject-details">
                      <div className="teacher-subject-name">{sub.name}</div>
                      <div className="teacher-subject-meta">Class: {sub.classLevelId?.name || "Unassigned"}</div>
                      <div className="teacher-subject-meta">{sub.academicYearId?.name || "No Academic Year"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
