import { useOutletContext } from "react-router-dom";

function fmt(d) {
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "—"; }
}

export default function StudentAcademicHistory() {
  const { profileData, loading } = useOutletContext();

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>;
  if (!profileData) return null;

  const { enrollments = [], promotions = [] } = profileData;

  const actionColor = { promoted: "#22c55e", graduated: "#6366f1", repeated: "#f59e0b", transferred: "#94a3b8" };

  return (
    <div>
      <div className="page-header">
        <h1>Academic History</h1>
        <p>Your complete enrollment and promotion records.</p>
      </div>

      {/* Timeline style promotions */}
      {promotions.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><div className="card-title">Promotion History</div><div className="card-subtitle">{promotions.length} records</div></div>
          <div className="card-body" style={{ padding: "20px 24px" }}>
            {promotions.map((p, i) => {
              const color = actionColor[p.action] || "#94a3b8";
              return (
                <div key={p._id} style={{ display: "flex", gap: 16, marginBottom: i < promotions.length - 1 ? 24 : 0 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${color}18`, border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: ".8rem" }}>{p.action === "promoted" ? "⬆️" : p.action === "graduated" ? "🎓" : p.action === "transferred" ? "↔️" : "🔄"}</span>
                    </div>
                    {i < promotions.length - 1 && <div style={{ width: 2, flex: 1, background: "var(--border-light)", marginTop: 6 }} />}
                  </div>
                  <div style={{ paddingTop: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: ".8rem", fontWeight: 800, color, textTransform: "capitalize", padding: "2px 10px", borderRadius: 999, background: `${color}12` }}>{p.action}</span>
                      <span style={{ fontSize: ".72rem", color: "var(--text-muted)" }}>{fmt(p.createdAt)}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: ".88rem", color: "var(--text)" }}>
                      {p.fromClassLevelId?.name || "—"} → {p.toClassLevelId?.name || "—"}
                    </div>
                    <div style={{ fontSize: ".75rem", color: "var(--text-muted)", marginTop: 2 }}>
                      {p.fromAcademicYearId?.name} → {p.toAcademicYearId?.name}
                    </div>
                    {p.reason && <div style={{ fontSize: ".75rem", color: "var(--text-muted)", marginTop: 4, fontStyle: "italic" }}>"{p.reason}"</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Enrollments table */}
      <div className="card">
        <div className="card-header"><div className="card-title">Class Enrollments</div><div className="card-subtitle">{enrollments.length} records</div></div>
        <div className="card-body" style={{ padding: 0 }}>
          {enrollments.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>
              <h3 style={{ fontSize: "1rem" }}>No enrollment records</h3>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Academic Year</th><th>Class</th><th>Section</th><th>Roll No</th><th>Status</th><th>Enrolled</th></tr>
                </thead>
                <tbody>
                  {enrollments.map(e => (
                    <tr key={e._id}>
                      <td style={{ fontWeight: 700 }}>{e.academicYearId?.name || "—"}</td>
                      <td className="td-muted">{e.classLevelId?.name || "—"}</td>
                      <td className="td-muted">{e.sectionId?.name || "—"}</td>
                      <td><span style={{ fontFamily: "monospace", fontSize: ".78rem" }}>{e.rollNo || "—"}</span></td>
                      <td><span className={`badge ${e.status === "active" ? "badge-green" : "badge-gray"}`} style={{ textTransform: "capitalize" }}>{e.status}</span></td>
                      <td className="td-muted">{fmt(e.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
