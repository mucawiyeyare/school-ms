import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { auth } from "../lib/auth";

function StatCard({ label, value, icon, color, iconBg, badge, badgeBg, progress = 78 }) {
  return (
    <div className="stat-card animate-fade">
      <div className="stat-icon" style={{ background: iconBg }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div style={{ flex: 1 }}>
        <div className="stat-value" style={{ color }}>
          {value ?? <span className="skeleton" style={{ display: "inline-block", width: 48, height: 32 }} />}
        </div>
        <div className="stat-label">{label}</div>
        {badge && <div className="stat-badge" style={{ background: badgeBg || iconBg, color }}>{badge}</div>}
        <div style={{ marginTop: 10, height: 5, borderRadius: 999, background: "#e2e8f0", overflow: "hidden" }}>
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              borderRadius: 999,
              background: `linear-gradient(90deg, ${color}, #fbbf24)`,
              transition: "width 0.8s ease",
            }}
          />
        </div>
      </div>
    </div>
  );
}

const DEFAULT_SLIDES = [
  {
    badge: "Academic Excellence · 2025/2026",
    title: "Institutional Governance & Real-Time Academic Analytics",
    desc: "Monitor student enrollments, daily attendance, examination marks, class rankings, and automated promotions from one unified executive workspace.",
    ctaLabel: "Open Rankings & Marks",
    ctaLink: "/marks/rankings",
    accent: "#fbbf24",
  },
  {
    badge: "Admissions & Student Records",
    title: "Streamlined Student Registration & EMIS Tracking",
    desc: "Maintain complete academic histories, guardian contacts, fee payment records, and promotion logs for every enrolled student across all class levels.",
    ctaLabel: "Register New Student",
    ctaLink: "/students/register",
    accent: "#34d399",
  },
  {
    badge: "Executive Support & Communications",
    title: "Dedicated Contact Desk & Department Directory",
    desc: "Connect parents, students, and faculty with Admissions, Academic Board, Finance, and IT Helpdesk through our interactive Contact Us center.",
    ctaLabel: "Visit Contact Us Page",
    ctaLink: "/contact",
    accent: "#93c5fd",
  },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [slideIdx, setSlideIdx] = useState(0);
  const user = auth.getUser();
  const isTeacher = user?.role === "Teacher";

  useEffect(() => {
    api.get("/api/auth/dashboard-stats").then((r) => setStats(r.data)).catch(() => {});
    api.get("/api/announcements").then((r) => setAnnouncements((r.data || []).slice(0, 4))).catch(() => {});
    if (user?.role === "Teacher") {
      api.get("/api/subjects").then((r) => setTeacherSubjects(r.data || [])).catch(() => {});
    }
  }, [user?.role]);

  // Build dynamic slides combining institutional highlights + latest announcements
  const slides = [
    ...DEFAULT_SLIDES,
    ...announcements.map((a) => ({
      badge: `Official Announcement · ${(a.priority || "normal").toUpperCase()}`,
      title: a.title,
      desc: a.content,
      ctaLabel: "View All Announcements",
      ctaLink: "/announcements",
      accent: "#f59e0b",
    })),
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const currentSlide = slides[slideIdx % slides.length] || DEFAULT_SLIDES[0];

  const cards = [
    {
      label: "Total Students",
      value: stats?.totalStudents,
      color: "#1d4ed8",
      iconBg: "#eaf2ff",
      badge: "Enrolled Roster",
      badgeBg: "#dbeafe",
      progress: 88,
      icon: <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 22, height: 22 }}><path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm-8 9a8 8 0 1 1 16 0H4Z"/></svg>,
    },
    {
      label: "Active Enrollments",
      value: stats?.totalEnrollments,
      color: "#059669",
      iconBg: "#d1fae5",
      badge: "2025/2026 Year",
      badgeBg: "#dcfce7",
      progress: 92,
      roles: ["Admin"],
      icon: <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 22, height: 22 }}><path d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H9l-6 2V6a2 2 0 0 1 2-2Zm3 4v2h8V8H8Zm0 4v2h6v-2H8Z"/></svg>,
    },
    {
      label: "Faculty & Teachers",
      value: stats?.totalTeachers,
      color: "#7c3aed",
      iconBg: "#ede9fe",
      badge: "Academic Staff",
      badgeBg: "#f1eaff",
      progress: 80,
      roles: ["Admin"],
      icon: <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 22, height: 22 }}><path d="M17 10a5 5 0 1 0-10 0 5 5 0 0 0 10 0ZM3 21a9 9 0 0 1 18 0H3Z"/></svg>,
    },
    {
      label: "Announcements",
      value: stats?.totalAnnouncements,
      color: "#d97706",
      iconBg: "#fef3c7",
      badge: "Published Notices",
      badgeBg: "#fff2d6",
      progress: 74,
      icon: <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 22, height: 22 }}><path d="M3 8v8h2l4 4h2V4H9L5 8H3Zm14-2a7 7 0 0 1 0 12v-2a5 5 0 0 0 0-8V6Z"/></svg>,
    },
  ];

  const quickActions = [
    {
      label: "Manage Students",
      href: "/students",
      color: "#1d4ed8",
      bg: "#eaf2ff",
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
      label: "Enter Exam Marks",
      href: "/marks/entry",
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
      label: "Contact & Support",
      href: "/contact",
      color: "#dc2626",
      bg: "#fee2e2",
      icon: <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20 }}><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4.2-8 5-8-5V6l8 5 8-5v2.2Z"/></svg>,
    },
  ];

  const firstName = user?.name?.split(" ")[0] || "Admin";

  return (
    <div className="dashboard-shell">
      {/* Hero Banner */}
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
            <div className="dashboard-brand-text">School Management System · Executive Portal</div>
          </div>

          <h1 className="dashboard-title">Welcome back, {firstName}</h1>
          <p className="dashboard-subtitle">Here is what is happening across your school campus today.</p>

          <div className="dashboard-actions">
            <Link to="/students" className="btn btn-primary btn-sm">
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 15 }}><path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm-8 9a8 8 0 1 1 16 0H4Z"/></svg>
              Manage Students
            </Link>
            <Link to="/announcements" className="btn btn-secondary btn-sm">
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 15 }}><path d="M3 8v8h2l4 4h2V4H9L5 8H3Zm14-2a7 7 0 0 1 0 12v-2a5 5 0 0 0 0-8V6Z"/></svg>
              Post Announcement
            </Link>
            <Link to="/contact" className="btn btn-secondary btn-sm">
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 15 }}><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4.2-8 5-8-5V6l8 5 8-5v2.2Z"/></svg>
              Contact & Support Desk
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive School Highlights & Live Announcements Carousel Slider */}
      <section className="pro-slider">
        <div className="pro-slider-slide" key={slideIdx} style={{ minHeight: 175, padding: "26px 34px" }}>
          <div style={{ flex: 1 }}>
            <div className="pro-slider-badge">
              <span>✦</span>
              <span>{currentSlide.badge}</span>
            </div>
            <h2 className="pro-slider-title" style={{ fontSize: "1.55rem" }}>
              {currentSlide.title}
            </h2>
            <p className="pro-slider-desc" style={{ fontSize: "0.94rem" }}>
              {currentSlide.desc}
            </p>
          </div>
          <div>
            <Link
              to={currentSlide.ctaLink}
              className="btn"
              style={{
                background: currentSlide.accent,
                color: "#0f172a",
                fontWeight: 700,
                boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
              }}
            >
              {currentSlide.ctaLabel} →
            </Link>
          </div>
        </div>
        <div className="pro-slider-controls" style={{ padding: "10px 34px 14px" }}>
          <div className="pro-slider-dots">
            {slides.map((_, idx) => (
              <button
                key={idx}
                className={`pro-slider-dot ${idx === slideIdx ? "active" : ""}`}
                onClick={() => setSlideIdx(idx)}
              />
            ))}
          </div>
          <div className="pro-slider-arrows">
            <button
              className="pro-slider-arrow"
              onClick={() => setSlideIdx((prev) => (prev - 1 + slides.length) % slides.length)}
            >
              ‹
            </button>
            <button
              className="pro-slider-arrow"
              onClick={() => setSlideIdx((prev) => (prev + 1) % slides.length)}
            >
              ›
            </button>
          </div>
        </div>
      </section>

      {/* Elevated 3D Stat Cards */}
      <div className="stat-grid dashboard-stats">
        {cards
          .filter((c) => !c.roles || c.roles.includes(user?.role || "Admin"))
          .map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
      </div>

      {/* Quick Actions Card */}
      <div className="card animate-fade">
        <div className="card-header">
          <div>
            <div className="card-title">Executive Quick Actions</div>
            <div className="card-subtitle">Instant access to essential school administration modules</div>
          </div>
        </div>
        <div className="card-body">
          <div className="dashboard-quick-grid">
            {quickActions
              .filter((action) => !action.roles || action.roles.includes(user?.role || "Admin"))
              .map((action) => (
                <Link
                  key={action.label}
                  to={action.href}
                  className="dashboard-quick-action"
                  style={{ "--quick-color": action.color, "--quick-bg": action.bg }}
                >
                  <div className="dashboard-quick-icon">{action.icon}</div>
                  <span>{action.label}</span>
                </Link>
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
