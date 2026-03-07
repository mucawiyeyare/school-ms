import { useEffect, useState } from "react";
import { api } from "../lib/api";

function StatBox({ label, value, color, icon }) {
  return (
    <div style={{ background: "var(--surface)", borderRadius: 14, padding: "20px 22px", border: "1px solid var(--border-light)", display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: "1.5rem", fontWeight: 800, color }}>{value ?? <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "1rem" }}>—</span>}</div>
        <div style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div className="card-header">
        <div>
          <div className="card-title">{title}</div>
          {subtitle && <div className="card-subtitle">{subtitle}</div>}
        </div>
      </div>
      <div className="card-body" style={{ padding: 0 }}>
        {children}
      </div>
    </div>
  );
}

function fmtDate(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "—"; }
}

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        const [statsRes, studentsRes, paymentsRes, attendanceRes, resultsRes] = await Promise.all([
          api.get("/api/auth/dashboard-stats").catch(() => ({ data: {} })),
          api.get("/api/students?limit=1000").catch(() => ({ data: { items: [] } })),
          api.get("/api/fees/payments").catch(() => ({ data: [] })),
          api.get("/api/attendance?limit=2000").catch(() => ({ data: [] })),
          api.get("/api/results?limit=2000").catch(() => ({ data: [] })),
        ]);
        setData({
          stats: statsRes.data || {},
          students: studentsRes.data?.items || [],
          payments: Array.isArray(paymentsRes.data) ? paymentsRes.data : [],
          attendance: Array.isArray(attendanceRes.data) ? attendanceRes.data : [],
          results: Array.isArray(resultsRes.data) ? resultsRes.data : [],
        });
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to load report data");
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  function printSection(id, title) {
    const el = document.getElementById(id);
    if (!el) return;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    const html = "<!DOCTYPE html><html><head><meta charset='utf-8'><title>" + title + "</title>" +
      "<style>body{font-family:'Segoe UI',Arial,sans-serif;margin:24px;color:#1a1a1a;}table{width:100%;border-collapse:collapse;}th,td{padding:8px 10px;text-align:left;border-bottom:1px solid #e2e8f0;font-size:.85rem;}th{background:#f8fafc;font-weight:700;}h2{color:#4f46e5;margin-bottom:16px;}@media print{body{margin:0;}}</style>" +
      "</head><body><h2>" + title + "</h2>" + el.innerHTML +
      "<script>window.onload=function(){window.print();}<\/script></body></html>";
    win.document.write(html);
    win.document.close();
  }

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading report data...</div>;
  if (error) return <div className="alert alert-error" style={{ margin: 32 }}>{error}</div>;
  if (!data) return null;

  const { stats, students, payments, attendance, results } = data;

  // ── Computed metrics ──
  const activeStudents = students.filter(s => s.status === "active").length;
  const totalPaid = payments.filter(p => p.status === "paid").reduce((s, p) => s + (p.amountPaid || 0), 0);
  const totalPartial = payments.filter(p => p.status === "partial").length;
  const totalUnpaid = payments.filter(p => p.status === "unpaid").length;

  const presentCount = attendance.filter(a => a.status === "present").length;
  const totalAttendance = attendance.length;
  const attendancePct = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

  const avgMark = results.length > 0
    ? Math.round(results.reduce((s, r) => s + (r.maxMarks > 0 ? (r.marksObtained / r.maxMarks) * 100 : 0), 0) / results.length)
    : 0;

  // ── Gender breakdown ──
  const maleCount = students.filter(s => s.gender === "male" || s.gender === "Male").length;
  const femaleCount = students.filter(s => s.gender === "female" || s.gender === "Female").length;

  // ── Status breakdown ──
  const statusMap = students.reduce((acc, s) => { acc[s.status || "unknown"] = (acc[s.status || "unknown"] || 0) + 1; return acc; }, {});

  // ── Top paying students ──
  const paymentsByStudent = payments.reduce((acc, p) => {
    const id = p.studentId?._id || p.studentId;
    if (!id) return acc;
    if (!acc[id]) acc[id] = { name: (p.studentId?.firstName || "") + " " + (p.studentId?.lastName || ""), total: 0, count: 0 };
    acc[id].total += p.amountPaid || 0;
    acc[id].count += 1;
    return acc;
  }, {});
  const topPayers = Object.values(paymentsByStudent).sort((a, b) => b.total - a.total).slice(0, 10);

  // ── Recent payments ──
  const recentPayments = [...payments].sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)).slice(0, 20);

  const TABS = [
    { id: "overview", label: "📊 Overview" },
    { id: "fees", label: "💳 Fee Report" },
    { id: "attendance", label: "✅ Attendance Report" },
    { id: "results", label: "📝 Academic Report" },
    { id: "students", label: "👤 Students Report" },
  ];

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1>System Reports</h1>
          <p>Comprehensive overview of all school data and metrics.</p>
        </div>
        <div style={{ fontSize: ".77rem", color: "var(--text-muted)", fontWeight: 600 }}>
          Generated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--border-light)", marginBottom: 24, overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "10px 18px", background: "none", border: "none", cursor: "pointer",
            fontSize: ".82rem", fontWeight: 700, fontFamily: "inherit", whiteSpace: "nowrap",
            color: tab === t.id ? "var(--primary,#6366f1)" : "var(--text-muted)",
            borderBottom: `2.5px solid ${tab === t.id ? "var(--primary,#6366f1)" : "transparent"}`,
            marginBottom: -2, transition: "all .15s"
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
            <StatBox label="Total Students" value={students.length} color="#6366f1" icon="🎓" />
            <StatBox label="Active Students" value={activeStudents} color="#22c55e" icon="✅" />
            <StatBox label="Total Fee Collected" value={"$" + totalPaid.toLocaleString()} color="#f59e0b" icon="💰" />
            <StatBox label="Attendance Rate" value={attendancePct + "%"} color={attendancePct >= 75 ? "#22c55e" : "#ef4444"} icon="📅" />
            <StatBox label="Avg. Exam Score" value={avgMark + "%"} color="#8b5cf6" icon="📝" />
            <StatBox label="Total Payments" value={payments.length} color="#06b6d4" icon="💳" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
            {/* Gender */}
            <div className="card">
              <div className="card-header"><div className="card-title">Gender Distribution</div></div>
              <div className="card-body">
                {[{ label: "Male", value: maleCount, color: "#6366f1" }, { label: "Female", value: femaleCount, color: "#ec4899" }, { label: "Other / Not Set", value: students.length - maleCount - femaleCount, color: "#94a3b8" }].map(g => (
                  <div key={g.label} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: ".82rem", fontWeight: 600 }}>{g.label}</span>
                      <span style={{ fontSize: ".82rem", fontWeight: 700, color: g.color }}>{g.value} ({students.length > 0 ? Math.round(g.value / students.length * 100) : 0}%)</span>
                    </div>
                    <div style={{ height: 7, background: "var(--border-light)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: students.length > 0 ? (g.value / students.length * 100) + "%" : "0%", height: "100%", background: g.color, borderRadius: 4, transition: "width .4s" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="card">
              <div className="card-header"><div className="card-title">Student Status</div></div>
              <div className="card-body">
                {Object.entries(statusMap).map(([status, count]) => {
                  const color = status === "active" ? "#22c55e" : status === "graduated" ? "#6366f1" : status === "suspended" ? "#f59e0b" : "#ef4444";
                  return (
                    <div key={status} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border-light)" }}>
                      <span className={`badge ${status === "active" ? "badge-green" : "badge-gray"}`} style={{ textTransform: "capitalize" }}>{status}</span>
                      <span style={{ fontWeight: 700, color }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment summary */}
            <div className="card">
              <div className="card-header"><div className="card-title">Fee Payment Summary</div></div>
              <div className="card-body">
                {[
                  { label: "Paid", value: payments.filter(p => p.status === "paid").length, color: "#22c55e" },
                  { label: "Partial", value: totalPartial, color: "#f59e0b" },
                  { label: "Unpaid", value: totalUnpaid, color: "#ef4444" },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border-light)" }}>
                    <span style={{ fontSize: ".85rem", fontWeight: 600 }}>{item.label}</span>
                    <span style={{ fontWeight: 800, color: item.color, fontSize: "1.1rem" }}>{item.value}</span>
                  </div>
                ))}
                <div style={{ marginTop: 14, padding: "10px 0", borderTop: "2px solid var(--border-light)", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 700 }}>Total Collected</span>
                  <span style={{ fontWeight: 800, color: "#22c55e", fontSize: "1.1rem" }}>${totalPaid.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FEES REPORT ── */}
      {tab === "fees" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => printSection("fees-table", "Fee Payments Report")}>🖨️ Print Report</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
            <StatBox label="Total Collected" value={"$" + totalPaid.toLocaleString()} color="#22c55e" icon="💰" />
            <StatBox label="Paid Records" value={payments.filter(p => p.status === "paid").length} color="#22c55e" icon="✅" />
            <StatBox label="Partial Records" value={totalPartial} color="#f59e0b" icon="⏳" />
            <StatBox label="Unpaid Records" value={totalUnpaid} color="#ef4444" icon="❌" />
          </div>

          {/* Top payers */}
          <Section title="Top Paying Students" subtitle="Ranked by total amount paid">
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Student</th><th>Payments</th><th>Total Paid</th></tr></thead>
                <tbody>
                  {topPayers.length === 0
                    ? <tr><td colSpan={4} style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>No payment data</td></tr>
                    : topPayers.map((s, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 700, color: i < 3 ? "#f59e0b" : "var(--text-muted)", width: 40 }}>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{s.name || "—"}</td>
                        <td className="td-muted">{s.count}</td>
                        <td style={{ fontWeight: 800, color: "#22c55e" }}>${s.total.toLocaleString()}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Recent payments */}
          <div id="fees-table">
            <Section title="Recent Payment Records" subtitle={`Last ${recentPayments.length} payments`}>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Student</th><th>Fee</th><th>Amount Paid</th><th>Method</th><th>Receipt</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {recentPayments.length === 0
                      ? <tr><td colSpan={7} style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>No payments recorded</td></tr>
                      : recentPayments.map(p => (
                        <tr key={p._id}>
                          <td style={{ fontWeight: 600 }}>{p.studentId?.firstName} {p.studentId?.lastName}</td>
                          <td className="td-muted">{p.feeStructureId?.name || "—"}</td>
                          <td style={{ fontWeight: 800, color: "#22c55e" }}>${(p.amountPaid || 0).toLocaleString()}</td>
                          <td className="td-muted" style={{ textTransform: "capitalize" }}>{(p.method || "—").replace(/_/g, " ")}</td>
                          <td className="td-muted" style={{ fontFamily: "monospace" }}>{p.receiptNo || "—"}</td>
                          <td><span className={`badge ${p.status === "paid" ? "badge-green" : p.status === "partial" ? "badge-blue" : "badge-red"}`} style={{ textTransform: "capitalize" }}>{p.status}</span></td>
                          <td className="td-muted">{fmtDate(p.paymentDate)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>
        </div>
      )}

      {/* ── ATTENDANCE REPORT ── */}
      {tab === "attendance" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => printSection("attendance-table", "Attendance Report")}>🖨️ Print Report</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
            <StatBox label="Total Sessions" value={totalAttendance} color="#6366f1" icon="📅" />
            <StatBox label="Present" value={presentCount} color="#22c55e" icon="✅" />
            <StatBox label="Absent" value={attendance.filter(a => a.status === "absent").length} color="#ef4444" icon="❌" />
            <StatBox label="Late" value={attendance.filter(a => a.status === "late").length} color="#f59e0b" icon="⏰" />
            <StatBox label="Attendance Rate" value={attendancePct + "%"} color={attendancePct >= 75 ? "#22c55e" : "#ef4444"} icon="📊" />
          </div>
          <div id="attendance-table">
            <Section title="Attendance Log" subtitle={`${totalAttendance} records`}>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Date</th><th>Student</th><th>Class</th><th>Period</th><th>Status</th><th>Note</th></tr></thead>
                  <tbody>
                    {attendance.length === 0
                      ? <tr><td colSpan={6} style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>No attendance records</td></tr>
                      : attendance.slice(0, 100).map((a, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{fmtDate(a.date)}</td>
                          <td>{a.studentId?.firstName} {a.studentId?.lastName}</td>
                          <td className="td-muted">{a.classLevel?.name || a.classLevelId?.name || "—"}</td>
                          <td className="td-muted">{a.period || "—"}</td>
                          <td><span className={`badge ${a.status === "present" ? "badge-green" : a.status === "late" ? "badge-blue" : a.status === "excused" ? "badge-gray" : "badge-red"}`} style={{ textTransform: "capitalize" }}>{a.status}</span></td>
                          <td className="td-muted">{a.note || "—"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>
        </div>
      )}

      {/* ── RESULTS REPORT ── */}
      {tab === "results" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => printSection("results-table", "Academic Results Report")}>🖨️ Print Report</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
            <StatBox label="Total Results" value={results.length} color="#6366f1" icon="📝" />
            <StatBox label="Average Score" value={avgMark + "%"} color={avgMark >= 60 ? "#22c55e" : "#ef4444"} icon="📊" />
            <StatBox label="Passed (≥60%)" value={results.filter(r => r.maxMarks > 0 && (r.marksObtained / r.maxMarks) >= 0.6).length} color="#22c55e" icon="✅" />
            <StatBox label="Failed (<60%)" value={results.filter(r => r.maxMarks > 0 && (r.marksObtained / r.maxMarks) < 0.6).length} color="#ef4444" icon="❌" />
          </div>
          <div id="results-table">
            <Section title="Exam Results" subtitle={`${results.length} records`}>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Student</th><th>Subject</th><th>Exam Term</th><th>Marks</th><th>Score</th><th>Grade</th></tr></thead>
                  <tbody>
                    {results.length === 0
                      ? <tr><td colSpan={6} style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>No result records</td></tr>
                      : results.slice(0, 100).map(r => {
                          const pct = r.maxMarks > 0 ? Math.round((r.marksObtained / r.maxMarks) * 100) : 0;
                          return (
                            <tr key={r._id}>
                              <td style={{ fontWeight: 600 }}>{r.studentId?.firstName} {r.studentId?.lastName}</td>
                              <td className="td-muted">{r.subjectId?.name || "—"}</td>
                              <td className="td-muted">{r.examTermId?.name || "—"}</td>
                              <td className="td-muted">{r.marksObtained} / {r.maxMarks}</td>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <div style={{ width: 50, height: 6, borderRadius: 3, background: "var(--border-light)", overflow: "hidden" }}>
                                    <div style={{ width: pct + "%", height: "100%", background: pct >= 60 ? "#22c55e" : "#ef4444", borderRadius: 3 }} />
                                  </div>
                                  <span style={{ fontSize: ".8rem", fontWeight: 700 }}>{pct}%</span>
                                </div>
                              </td>
                              <td><span className={`badge ${r.grade === "A+" || r.grade === "A" ? "badge-green" : r.grade === "B" ? "badge-blue" : r.grade === "F" ? "badge-red" : "badge-gray"}`}>{r.grade || "—"}</span></td>
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>
        </div>
      )}

      {/* ── STUDENTS REPORT ── */}
      {tab === "students" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => printSection("students-table", "Students Report")}>🖨️ Print Report</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
            <StatBox label="Total Students" value={students.length} color="#6366f1" icon="🎓" />
            <StatBox label="Active" value={activeStudents} color="#22c55e" icon="✅" />
            <StatBox label="Male" value={maleCount} color="#3b82f6" icon="👦" />
            <StatBox label="Female" value={femaleCount} color="#ec4899" icon="👧" />
          </div>
          <div id="students-table">
            <Section title="All Students" subtitle={`${students.length} students`}>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>EMIS No</th><th>Name</th><th>Class</th><th>Gender</th><th>Status</th><th>Admission Date</th></tr></thead>
                  <tbody>
                    {students.length === 0
                      ? <tr><td colSpan={6} style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>No students found</td></tr>
                      : students.map(s => (
                        <tr key={s._id}>
                          <td style={{ fontFamily: "monospace", fontWeight: 700 }}>{s.rollNumber || "—"}</td>
                          <td style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</td>
                          <td className="td-muted">{s.classLevelId?.name || "—"}</td>
                          <td className="td-muted" style={{ textTransform: "capitalize" }}>{s.gender || "—"}</td>
                          <td><span className={`badge ${s.status === "active" ? "badge-green" : "badge-gray"}`} style={{ textTransform: "capitalize" }}>{s.status || "—"}</span></td>
                          <td className="td-muted">{fmtDate(s.admissionDate)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>
        </div>
      )}
    </div>
  );
}
