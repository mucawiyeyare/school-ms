import { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";

function StatCard({ icon, label, value, sub, iconBg, textColor }) {
  return (
    <div className="stat-card animate-fade">
      <div className="stat-icon" style={{ background: iconBg || "#eaf2ff", fontSize: "1.4rem" }}>
        {icon}
      </div>
      <div>
        <div className="stat-value" style={{ color: textColor || "var(--text)" }}>{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-badge" style={{ background: iconBg || "#eaf2ff", color: textColor || "var(--primary)" }}>{sub}</div>}
      </div>
    </div>
  );
}

const STUDENT_SLIDES = [
  {
    badge: "Student Academic Portal",
    title: "Track Your Exam Results, Rankings & Report Cards",
    desc: "View your subject marks across Monthly, Midterm, and Final examinations, check your class position, and monitor your academic growth.",
    ctaLabel: "View Exam Results",
    ctaLink: "/student/exams",
    accent: "#fbbf24",
  },
  {
    badge: "Attendance & Punctuality",
    title: "Maintain Strong Classroom Attendance",
    desc: "Review your daily attendance sessions and percentage rating to stay eligible for academic honors and seamless grade promotion.",
    ctaLabel: "Check Attendance",
    ctaLink: "/student/attendance",
    accent: "#34d399",
  },
  {
    badge: "Student Support & Counseling",
    title: "Need Assistance From Academic or IT Support?",
    desc: "Reach out to our Student Welfare, Finance, or Portal Helpdesk directly through the official Contact Us center.",
    ctaLabel: "Open Contact Us Desk",
    ctaLink: "/student/contact",
    accent: "#93c5fd",
  },
];

function gradeColor(g) {
  if (!g) return "#94a3b8";
  if (g === "A+" || g === "A") return "#10b981";
  if (g === "B") return "#2563eb";
  if (g === "C") return "#f59e0b";
  if (g === "F") return "#ef4444";
  return "#94a3b8";
}

export default function StudentHome() {
  const { profileData, loading } = useOutletContext();
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % STUDENT_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading dashboard...</div>;
  if (!profileData) return null;

  const { student, results = [], attendance = [], attendanceStats = {}, feePayments = [], totalFeePaid = 0 } = profileData;
  const recentResults = results.slice(0, 5);
  const recentAtt = attendance.slice(0, 5);
  const paidCount = feePayments.filter(p => p.status === "paid").length;
  const currentSlide = STUDENT_SLIDES[slideIdx];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Welcome back, {student.firstName}! 🎓</h1>
          <p>Here is a comprehensive overview of your academic progress and campus records.</p>
        </div>
        <Link to="/student/contact" className="btn btn-primary btn-sm">
          Contact Support Desk →
        </Link>
      </div>

      {/* Interactive Student Spotlight Slider */}
      <section className="pro-slider">
        <div className="pro-slider-slide" key={slideIdx} style={{ minHeight: 170, padding: "26px 34px" }}>
          <div style={{ flex: 1 }}>
            <div className="pro-slider-badge">
              <span>✦</span>
              <span>{currentSlide.badge}</span>
            </div>
            <h2 className="pro-slider-title" style={{ fontSize: "1.5rem" }}>{currentSlide.title}</h2>
            <p className="pro-slider-desc" style={{ fontSize: "0.92rem" }}>{currentSlide.desc}</p>
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
            {STUDENT_SLIDES.map((_, idx) => (
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
              onClick={() => setSlideIdx((prev) => (prev - 1 + STUDENT_SLIDES.length) % STUDENT_SLIDES.length)}
            >
              ‹
            </button>
            <button
              className="pro-slider-arrow"
              onClick={() => setSlideIdx((prev) => (prev + 1) % STUDENT_SLIDES.length)}
            >
              ›
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: 28 }}>
        <StatCard
          icon="📝"
          label="Exam Results"
          value={results.length}
          sub="Total results recorded"
          iconBg="#ede9fe"
          textColor="#6d28d9"
        />
        <StatCard
          icon="✅"
          label="Attendance"
          value={attendanceStats.percentage !== null && attendanceStats.percentage !== undefined ? `${attendanceStats.percentage}%` : "—"}
          sub={`${attendanceStats.present || 0} present / ${attendanceStats.total || 0} sessions`}
          textColor={attendanceStats.percentage >= 75 ? "#059669" : "#dc2626"}
          iconBg="#d1fae5"
        />
        <StatCard
          icon="💳"
          label="Fees Paid"
          value={`$${totalFeePaid.toLocaleString()}`}
          sub={`${paidCount} payment(s) recorded`}
          textColor="#d97706"
          iconBg="#fef3c7"
        />
        <StatCard
          icon="🎓"
          label="Current Placement"
          value={student.classLevelId?.name || "—"}
          sub={student.sectionId ? `Section ${student.sectionId.name}` : "No section"}
          iconBg="#eaf2ff"
          textColor="#1d4ed8"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 22 }}>
        {/* Recent Results */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Examination Marks</div>
            <div className="card-subtitle">{results.length} total records</div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {recentResults.length === 0 ? (
              <div style={{ padding: "28px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: ".9rem" }}>No results yet</div>
            ) : (
              recentResults.map(r => {
                const maxMarks = 100;
                const pct = Math.round((r.marks / maxMarks) * 100);
                let grade = "F";
                if (pct >= 90) grade = "A+";
                else if (pct >= 80) grade = "A";
                else if (pct >= 70) grade = "B";
                else if (pct >= 60) grade = "C";
                else if (pct >= 50) grade = "D";

                return (
                  <div key={r._id} style={{ display: "flex", alignItems: "center", padding: "13px 22px", borderBottom: "1px solid var(--border-light)", gap: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: `${gradeColor(grade)}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".82rem", fontWeight: 700, color: gradeColor(grade), flexShrink: 0 }}>
                      {grade || "—"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: ".92rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.subjectId?.name || "Subject"}</div>
                      <div style={{ fontSize: ".78rem", color: "var(--text-muted)", textTransform: "capitalize", fontStyle: "italic" }}>{r.examTypeCode || "Exam"}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: ".95rem" }}>{pct}%</div>
                      <div style={{ fontSize: ".75rem", color: "var(--text-muted)" }}>{r.marks}/{maxMarks}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Attendance Log</div>
            <div className="card-subtitle">Latest classroom sessions</div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {recentAtt.length === 0 ? (
              <div style={{ padding: "28px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: ".9rem" }}>No records yet</div>
            ) : (
              recentAtt.map((a, i) => {
                const color = a.status === "present" ? "#10b981" : a.status === "late" ? "#f59e0b" : a.status === "excused" ? "#94a3b8" : "#ef4444";
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", padding: "13px 22px", borderBottom: "1px solid var(--border-light)", gap: 14 }}>
                    <div style={{ width: 9, height: 9, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: ".9rem" }}>{new Date(a.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
                      <div style={{ fontSize: ".78rem", color: "var(--text-muted)", fontStyle: "italic" }}>{a.period || "Morning Session"}</div>
                    </div>
                    <span style={{ fontSize: ".78rem", fontWeight: 700, padding: "3px 11px", borderRadius: 999, background: `${color}18`, color, textTransform: "capitalize" }}>{a.status}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
