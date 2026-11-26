import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { auth } from "../lib/auth";
import { api } from "../lib/api";

// ── Icons ──────────────────────────────────────────────────────────────────────
const icons = {
  dashboard: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z"/></svg>,
  profile:   <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm-8 9a8 8 0 1 1 16 0H4Z"/></svg>,
  results:   <svg viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-3 7 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  examResult:<svg viewBox="0 0 24 24" fill="none"><path d="M9 12h6M9 16h6M7 3H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2M7 3a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  attendance:<svg viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4M2 12a10 10 0 1 0 20 0A10 10 0 0 0 2 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>,
  fees:      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm-1 14v-2H9v-2h2v-1H9V9h2V7h2v2h2v2h-3v1h3v2h-2v2h-2Z"/></svg>,
  history:   <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6a7 7 0 1 1 2.05 4.95L6.62 18.4A9 9 0 1 0 13 3Z"/></svg>,
  chevron:   <svg viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
};

export default function StudentLayout() {
  const nav = useNavigate();
  const location = useLocation();
  const user = auth.getUser();
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [resultsOpen, setResultsOpen]   = useState(
    location.pathname.startsWith("/student/exams")
  );
  const [profileData, setProfileData]   = useState(null);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    api.get("/api/students/me")
      .then(r => setProfileData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Auto-expand Results section when on an exam sub-route
  useEffect(() => {
    if (location.pathname.startsWith("/student/exams")) {
      setResultsOpen(true);
    }
  }, [location.pathname]);

  function logout() { auth.clear(); nav("/login"); }

  function getInitials(name = "") {
    return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  }

  function renderAvatar(size = 32, extraClassName = "") {
    if (user?.avatar) {
      return (
        <img 
          src={`http://localhost:5000${user.avatar}`} 
          alt="Avatar" 
          className={extraClassName}
          style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} 
        />
      );
    }
    const initials = getInitials(user?.name || "S");
    return (
      <div 
        className={extraClassName}
        style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg, #818cf8, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: `${size * 0.4}px`, fontWeight: 700, color: "#fff", flexShrink: 0 }}
      >
        {initials}
      </div>
    );
  }

  const student = profileData?.student;

  const simpleNav = [
    { to: "/student/home",       label: "Dashboard",       icon: icons.dashboard  },
    { to: "/student/profile",    label: "My Profile",      icon: icons.profile    },
    { to: "/student/attendance", label: "Attendance",      icon: icons.attendance },
    { to: "/student/fees",       label: "Fee Payments",    icon: icons.fees       },
    { to: "/student/history",    label: "Academic History",icon: icons.history    },
  ];

  const isResultsActive = location.pathname.startsWith("/student/exams");

  return (
    <div className="layout">
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 99, background: "rgba(0,0,0,.5)", backdropFilter: "blur(2px)" }}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-inner">
            <svg className="sidebar-logo-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 2 2 7l10 5 10-5-10-5Zm0 8L5 6.5V12c0 3.4 2.9 6 7 6s7-2.6 7-6V6.5L12 10Z" fill="currentColor"/>
            </svg>
            <div>
              <div className="sidebar-logo-text">School SMS</div>
              <div className="sidebar-logo-sub">Student Portal</div>
            </div>
          </div>
        </div>

        {/* Student card */}
        {student && (
          <div className="sidebar-student-card">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {renderAvatar(48)}
              <div style={{ minWidth: 0 }}>
                <div className="sidebar-student-name">{user?.name}</div>
                <div className="sidebar-student-meta">
                  {student.emisNumber ? `EMIS # ${student.emisNumber}` : "No EMIS assigned"}
                </div>
              </div>
            </div>
            {student.classLevelId && (
              <div className="sidebar-student-badges">
                <span className="sidebar-student-badge">{student.classLevelId.name}</span>
                {student.sectionId && <span className="sidebar-student-badge">Section {student.sectionId.name}</span>}
                <span className={`sidebar-student-badge sidebar-student-status ${student.status === "active" ? "is-active" : "is-muted"}`}>
                  {student.status}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Nav */}
        <nav className="sidebar-nav">
          <section className="sidebar-group">
            <div className="sidebar-section-label">Navigation</div>

            {/* Simple nav items */}
            {simpleNav.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}

            {/* ── Results accordion ── */}
            <div>
              {/* Results parent toggle */}
              <button
                className={`nav-item ${isResultsActive ? "active" : ""}`}
                style={{ width: "100%", justifyContent: "space-between" }}
                onClick={() => setResultsOpen(o => !o)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="nav-icon">{icons.results}</span>
                  <span>Results</span>
                </div>
                <span style={{
                  display: "flex", transition: "transform .2s",
                  transform: resultsOpen ? "rotate(180deg)" : "none",
                  width: 16, height: 16, color: "rgba(255,255,255,.6)"
                }}>
                  {icons.chevron}
                </span>
              </button>

              {/* Sub-items */}
              {resultsOpen && (
                <div style={{ paddingLeft: 12, marginTop: 2 }}>
                  <NavLink
                    to="/student/exams"
                    className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                    onClick={() => setSidebarOpen(false)}
                    style={{ paddingLeft: 14, fontSize: ".78rem" }}
                  >
                    <span className="nav-icon" style={{ width: 14, height: 14 }}>{icons.examResult}</span>
                    <span>Exam Results</span>
                  </NavLink>
                </div>
              )}
            </div>
          </section>
        </nav>

        {/* Footer / Logout */}
        <div className="sidebar-footer sidebar-footer-logout" style={{ display: "flex", alignItems: "center", gap: 12 }} onClick={logout}>
          {renderAvatar(40)}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sidebar-user-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.name}
            </div>
            <div className="sidebar-user-role" style={{ color: "#ef4444" }}>Click to Logout</div>
          </div>
          <svg viewBox="0 0 24 24" fill="none" style={{ width: 16, flexShrink: 0, color: "#ef4444" }}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main-content">
        <header className="topbar">
          <button className="topbar-btn sidebar-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}>
              <path d="M3 18h18v-2H3v2Zm0-5h18v-2H3v2Zm0-7v2h18V6H3Z"/>
            </svg>
          </button>
          <span className="topbar-title">Student Portal</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {renderAvatar(32)}
            <span style={{ fontSize: ".8rem", fontWeight: 600, color: "var(--text)" }}>{user?.name}</span>
            <button className="topbar-btn danger" onClick={logout}>
              <svg viewBox="0 0 24 24" fill="none" style={{ width: 14 }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Logout
            </button>
          </div>
        </header>

        <main className="page-main animate-fade">
          <Outlet context={{ profileData, loading, reload: () => api.get("/api/students/me").then(r => setProfileData(r.data)) }} />
        </main>
      </div>
    </div>
  );
}
