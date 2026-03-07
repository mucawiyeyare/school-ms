import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { auth } from "../lib/auth";

const navGroups = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard", label: "Dashboard", roles: ["Admin", "Teacher"], icon: (
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z"/></svg>
      ) },
    ]
  },
  {
    label: "Academic",
    items: [
      { to: "/academic-years", label: "Academic Years", roles: ["Admin"], icon: (
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12.5a1.5 1.5 0 0 1-2.4 1.2L12 14.25 6.4 18.7A1.5 1.5 0 0 1 4 17.5V5Z"/></svg>
      ) },
      { to: "/classes", label: "Classes & Sections", roles: ["Admin", "Teacher"], icon: (
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 7.5 12 3l9 4.5-9 4.5-9-4.5Zm2 4.75 7 3.5v5L5 17.25v-5Zm14 0v5l-7 3.5v-5l7-3.5Z"/></svg>
      ) },
      { to: "/subjects", label: "Subjects", roles: ["Admin", "Teacher"], icon: (
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 2 7v10l10 5 10-5V7L12 2Zm0 2.2 7.5 3.75L12 11.7 4.5 7.95 12 4.2ZM4 9.45l7 3.5v7.1L4 16.55V9.45Zm9 10.6v-7.1l7-3.5v7.1l-7 3.5Z"/></svg>
      ) },
      { to: "/teachers", label: "Teachers", roles: ["Admin"], icon: (
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9a8 8 0 1 1 16 0H4Z"/><path d="M21 16H3M15 21H9" stroke="var(--surface)" strokeWidth="1.5"/></svg>
      ) },
    ]
  },
  {
    label: "Students",
    items: [
      { to: "/students", label: "Students", roles: ["Admin", "Teacher"], icon: (
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm-8 9a8 8 0 1 1 16 0H4Z"/></svg>
      ) },
      { to: "/students/register", label: "Register Student", roles: ["Admin"], icon: (
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-9 8a6 6 0 0 1 12 0H6Zm15-10h2v2h-2v2h-2v-2h-2v-2h2v-2h2v2Z"/></svg>
      ) },
      { to: "/promotions", label: "Promotions", roles: ["Admin"], icon: (
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="m6.5 17.5 1.5-1.5L11 19V9h2v10l3-3 1.5 1.5L12 22 6.5 17.5ZM12 2a5 5 0 1 1 0 10A5 5 0 0 1 12 2Z"/></svg>
      ) },
    ]
  },
  {
    label: "Learning",
    items: [
      { to: "/attendance", label: "Attendance", roles: ["Admin", "Teacher"], icon: (
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 11l3 3L22 4M2 12a10 10 0 1 0 20 0A10 10 0 0 0 2 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/><path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
      ) },
    ]
  },
  {
    label: "Marks & Exams",
    items: [
      { to: "/marks/entry", label: "Enter Marks", roles: ["Admin", "Teacher"], icon: (
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
      ) },
      { to: "/marks/rankings", label: "Rankings", roles: ["Admin", "Teacher"], icon: (
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.5 2h7L18 7.5V21a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7.5L8.5 2ZM8 12h8M8 16h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
      ) },
      { to: "/marks/exam-types", label: "Exam Type Settings", roles: ["Admin"], icon: (
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm0 5v7l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
      ) },
      { to: "/marks/assignments", label: "Teacher Assignments", roles: ["Admin"], icon: (
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
      ) },
    ]
  },
  {
    label: "Administration",
    items: [
      { to: "/announcements", label: "Announcements", roles: ["Admin", "Teacher"], icon: (
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 8v8h2l4 4h2V4H9L5 8H3Zm14-2a7 7 0 0 1 0 12v-2a5 5 0 0 0 0-8V6Z"/></svg>
      ) },
      { to: "/fees", label: "Fees", roles: ["Admin"], icon: (
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm-1 14v-2H9v-2h2v-1H9V9h2V7h2v2h2v2h-3v1h3v2h-2v2h-2Z"/></svg>
      ) },
      { to: "/users", label: "Users", roles: ["Admin"], icon: (
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 0a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 8v-1a6 6 0 0 1 6-6h1M14 22v-1a6 6 0 0 1 6-6h1" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
      ) },
      { to: "/reports", label: "Reports", roles: ["Admin"], icon: (
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2ZM9 17H7v-7h2v7Zm4 0h-2V7h2v10Zm4 0h-2v-4h2v4Z"/></svg>
      ) },
    ]
  }
];

export default function AdminLayout() {
  const nav = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const userStr = localStorage.getItem("sms_user");
  const user = userStr ? JSON.parse(userStr) : null;

  function logout() {
    auth.clear();
    nav("/login");
  }

  function getInitials(name = "") {
    return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  }

  function getPageTitle() {
    const p = location.pathname;
    // Special dynamic route labels
    if (/^\/students\/[^/]+$/.test(p) && p !== "/students/register") return "Student Profile";
    if (/^\/students\/[^/]+\/history$/.test(p)) return "Student Profile";
    if (p === "/marks/entry")       return "Enter Marks";
    if (p === "/marks/rankings")    return "Rankings & Positions";
    if (p === "/marks/exam-types")  return "Exam Type Settings";
    if (p === "/marks/assignments")  return "Teacher Assignments";
    const all = navGroups.flatMap(g => g.items);
    // Sort longer paths first so /students/register matches before /students
    const sorted = [...all].sort((a, b) => b.to.length - a.to.length);
    return sorted.find(item => p.startsWith(item.to))?.label || "Dashboard";
  }

  return (
    <div className="layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 99,
            background: "rgba(0,0,0,.5)", backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-inner">
            <svg className="sidebar-logo-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 2 2 7l10 5 10-5-10-5Zm0 8L5 6.5V12c0 3.4 2.9 6 7 6s7-2.6 7-6V6.5L12 10Z" fill="currentColor"/>
            </svg>
            <div>
              <div className="sidebar-logo-text">School SMS</div>
              <div className="sidebar-logo-sub">Management System</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navGroups.map(group => {
            const filteredItems = group.items.filter(item => !item.roles || item.roles.includes(user?.role || "Admin"));
            if (filteredItems.length === 0) return null;
            return (
              <section className="sidebar-group" key={group.label}>
                <div className="sidebar-section-label">{group.label}</div>
                {filteredItems.map(item => (
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
              </section>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-avatar">{getInitials(user?.name || "A")}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sidebar-user-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.name || "Admin"}
            </div>
            <div className="sidebar-user-role">{user?.role || "Administrator"}</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          <button
            className="topbar-btn sidebar-toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}>
              <path d="M3 18h18v-2H3v2Zm0-5h18v-2H3v2Zm0-7v2h18V6H3Z"/>
            </svg>
          </button>

          <span className="topbar-title">{getPageTitle()}</span>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #818cf8, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".72rem", fontWeight: 700, color: "#fff" }}>
              {getInitials(user?.name || "A")}
            </div>
            <span style={{ fontSize: ".8rem", fontWeight: 600, color: "var(--text)" }}>{user?.name}</span>
            <button className="topbar-btn" onClick={() => nav("/profile")}>
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 14, height: 14 }}>
                 <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm-8 9a8 8 0 1 1 16 0H4Z" />
              </svg>
              Profile
            </button>
            <button className="topbar-btn danger" onClick={logout}>
              <svg viewBox="0 0 24 24" fill="none" style={{ width: 14, height: 14 }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Logout
            </button>
          </div>
        </header>

        <main className="page-main animate-fade">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
