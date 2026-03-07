import { useOutletContext } from "react-router-dom";

function StatCard({ icon, label, value, sub, gradient, textColor }) {
  return (
    <div style={{
      borderRadius: 16, padding: "22px 24px",
      background: gradient || "var(--surface)",
      border: "1px solid var(--border-light)",
      boxShadow: "0 2px 12px rgba(0,0,0,.06)"
    }}>
      <div style={{ fontSize: "1.5rem", marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: "1.7rem", fontWeight: 800, color: textColor || "var(--text)", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--text-muted)", marginTop: 6 }}>{label}</div>
      {sub && <div style={{ fontSize: ".7rem", color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function gradeColor(g) {
  if (!g) return "#94a3b8";
  if (g === "A+" || g === "A") return "#22c55e";
  if (g === "B") return "#3b82f6";
  if (g === "C") return "#f59e0b";
  if (g === "F") return "#ef4444";
  return "#94a3b8";
}

export default function StudentHome() {
  const { profileData, loading } = useOutletContext();

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading dashboard...</div>;
  if (!profileData) return null;

  const { student, results = [], attendance = [], attendanceStats = {}, feePayments = [], totalFeePaid = 0, promotions = [] } = profileData;

  // Recent results (last 5)
  const recentResults = results.slice(0, 5);

  // Latest 5 attendance
  const recentAtt = attendance.slice(0, 5);

  // Fee summary
  const paidCount = feePayments.filter(p => p.status === "paid").length;

  return (
    <div>
      <div className="page-header">
        <h1>Welcome back, {student.firstName}! 👋</h1>
        <p>Here's an overview of your academic progress.</p>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: 28 }}>
        <StatCard
          icon="📝"
          label="Exam Results"
          value={results.length}
          sub="Total results recorded"
          gradient="linear-gradient(135deg,rgba(99,102,241,.08),rgba(129,140,248,.04))"
        />
        <StatCard
          icon="✅"
          label="Attendance"
          value={attendanceStats.percentage !== null && attendanceStats.percentage !== undefined ? `${attendanceStats.percentage}%` : "—"}
          sub={`${attendanceStats.present || 0} present / ${attendanceStats.total || 0} sessions`}
          textColor={attendanceStats.percentage >= 75 ? "#22c55e" : "#ef4444"}
          gradient="linear-gradient(135deg,rgba(34,197,94,.08),rgba(34,197,94,.03))"
        />
        <StatCard
          icon="💳"
          label="Fees Paid"
          value={`$${totalFeePaid.toLocaleString()}`}
          sub={`${paidCount} payment(s) recorded`}
          textColor="#f59e0b"
          gradient="linear-gradient(135deg,rgba(245,158,11,.08),rgba(245,158,11,.03))"
        />
        <StatCard
          icon="🎓"
          label="Class"
          value={student.classLevelId?.name || "—"}
          sub={student.sectionId ? `Section ${student.sectionId.name}` : "No section"}
          gradient="linear-gradient(135deg,rgba(168,85,247,.08),rgba(168,85,247,.03))"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
        {/* Recent Results */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Results</div>
            <div className="card-subtitle">{results.length} total</div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {recentResults.length === 0 ? (
              <div style={{ padding: "28px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: ".85rem" }}>No results yet</div>
            ) : (
              recentResults.map(r => {
                const maxMarks = 100; // MarksRecords don't store maxMarks by default, usually 100
                const pct = Math.round((r.marks / maxMarks) * 100);
                // Grade computation
                let grade = "F";
                if (pct >= 90) grade = "A+";
                else if (pct >= 80) grade = "A";
                else if (pct >= 70) grade = "B";
                else if (pct >= 60) grade = "C";
                else if (pct >= 50) grade = "D";

                return (
                  <div key={r._id} style={{ display: "flex", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid var(--border-light)", gap: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${gradeColor(grade)}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".75rem", fontWeight: 800, color: gradeColor(grade), flexShrink: 0 }}>
                      {grade || "—"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: ".85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.subjectId?.name || "Subject"}</div>
                      <div style={{ fontSize: ".72rem", color: "var(--text-muted)", textTransform: "capitalize" }}>{r.examTypeCode || "Exam"}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: ".9rem" }}>{pct}%</div>
                      <div style={{ fontSize: ".68rem", color: "var(--text-muted)" }}>{r.marks}/{maxMarks}</div>
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
            <div className="card-title">Recent Attendance</div>
            <div className="card-subtitle">Last sessions</div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {recentAtt.length === 0 ? (
              <div style={{ padding: "28px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: ".85rem" }}>No records yet</div>
            ) : (
              recentAtt.map((a, i) => {
                const color = a.status === "present" ? "#22c55e" : a.status === "late" ? "#f59e0b" : a.status === "excused" ? "#94a3b8" : "#ef4444";
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid var(--border-light)", gap: 14 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: ".82rem" }}>{new Date(a.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
                      <div style={{ fontSize: ".7rem", color: "var(--text-muted)" }}>{a.period || "—"}</div>
                    </div>
                    <span style={{ fontSize: ".72rem", fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: `${color}18`, color, textTransform: "capitalize" }}>{a.status}</span>
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
