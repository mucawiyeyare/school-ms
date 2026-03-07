import { useOutletContext } from "react-router-dom";

function StatBox({ label, value, color }) {
  return (
    <div style={{ borderRadius: 14, padding: "20px", textAlign: "center", background: `${color}12`, border: `1px solid ${color}30` }}>
      <div style={{ fontSize: "1.8rem", fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--text-muted)", marginTop: 4 }}>{label}</div>
    </div>
  );
}

function fmt(d) {
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "—"; }
}

export default function StudentAttendance() {
  const { profileData, loading } = useOutletContext();

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>;
  if (!profileData) return null;

  const { attendance = [], attendanceStats: s = {} } = profileData;

  const statusColor = { present: "#22c55e", late: "#f59e0b", excused: "#94a3b8", absent: "#ef4444" };

  return (
    <div>
      <div className="page-header">
        <h1>Attendance</h1>
        <p>Your attendance records and summary statistics.</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 14, marginBottom: 24 }}>
        <StatBox label="Total Sessions" value={s.total || 0} color="#6366f1" />
        <StatBox label="Present" value={s.present || 0} color="#22c55e" />
        <StatBox label="Late" value={s.late || 0} color="#f59e0b" />
        <StatBox label="Excused" value={s.excused || 0} color="#94a3b8" />
        <StatBox label="Absent" value={s.absent || 0} color="#ef4444" />
        <StatBox
          label="Attendance Rate"
          value={s.percentage !== undefined && s.percentage !== null ? `${s.percentage}%` : "—"}
          color={s.percentage >= 75 ? "#22c55e" : "#ef4444"}
        />
      </div>

      {/* Ring visual */}
      {s.percentage !== null && s.percentage !== undefined && (
        <div className="card" style={{ marginBottom: 20, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            <div style={{ position: "relative", width: 100, height: 100, flexShrink: 0 }}>
              <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--border-light)" strokeWidth="3.5"/>
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  stroke={s.percentage >= 75 ? "#22c55e" : "#ef4444"}
                  strokeWidth="3.5"
                  strokeDasharray={`${s.percentage} ${100 - s.percentage}`}
                  strokeLinecap="round"
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: 800, color: s.percentage >= 75 ? "#22c55e" : "#ef4444" }}>
                {s.percentage}%
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text)", marginBottom: 4 }}>
                {s.percentage >= 90 ? "Excellent attendance!" : s.percentage >= 75 ? "Good attendance" : s.percentage >= 60 ? "Needs improvement" : "Critical — please attend regularly"}
              </div>
              <div style={{ fontSize: ".82rem", color: "var(--text-muted)" }}>
                You attended <strong>{s.present + (s.late || 0)}</strong> out of <strong>{s.total}</strong> sessions
              </div>
            </div>
          </div>
        </div>
      )}

      {attendance.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4M2 12a10 10 0 1 0 20 0A10 10 0 0 0 2 12Z" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
          <h3>No attendance records yet</h3>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Attendance Log</div>
            <div className="card-subtitle">{attendance.length} sessions</div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Date</th><th>Period</th><th>Class</th><th>Status</th><th>Note</th></tr>
                </thead>
                <tbody>
                  {attendance.map((a, i) => {
                    const color = statusColor[a.status] || "#94a3b8";
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{fmt(a.date)}</td>
                        <td className="td-muted">{a.period || "—"}</td>
                        <td className="td-muted">{a.classLevel?.name || "—"}{a.section ? ` · ${a.section.name}` : ""}</td>
                        <td>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: ".78rem", fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: `${color}18`, color, textTransform: "capitalize" }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                            {a.status}
                          </span>
                        </td>
                        <td className="td-muted">{a.note || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
