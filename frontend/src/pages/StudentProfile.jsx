import { useEffect, useState, useMemo } from "react";
import { api } from "../lib/api";

function printReceipt(p, student) {
  const win = window.open("", "_blank", "width=600,height=750");
  if (!win) return;
  const name = student ? student.firstName + " " + student.lastName : "—";
  const emis = student?.emisNumber || "—";
  const feeName = p.feeStructureId?.name || "—";
  const feeTotal = p.feeStructureId?.amount != null ? "$" + Number(p.feeStructureId.amount).toLocaleString() : "—";
  const amountPaid = p.amountPaid != null ? "$" + Number(p.amountPaid).toLocaleString() : "—";
  const balance = (p.feeStructureId?.amount != null && p.amountPaid != null)
    ? "$" + (Number(p.feeStructureId.amount) - Number(p.amountPaid)).toLocaleString() : "—";
  const method = (p.method || "—").replace(/_/g, " ");
  const status = p.status || "unpaid";
  const statusColors = { paid: "background:#dcfce7;color:#16a34a", partial: "background:#dbeafe;color:#1d4ed8", unpaid: "background:#fee2e2;color:#dc2626" };
  const statusStyle = statusColors[status] || statusColors.unpaid;
  const html = "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Payment Receipt</title>" +
    "<style>" +
    "body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1a1a1a;margin:0;padding:0;}" +
    ".page{max-width:520px;margin:32px auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px;}" +
    ".header{text-align:center;margin-bottom:24px;}" +
    ".header h1{margin:0 0 4px;font-size:1.4rem;color:#4f46e5;}" +
    ".header p{margin:0;font-size:.8rem;color:#64748b;}" +
    ".divider{border:none;border-top:2px dashed #e2e8f0;margin:20px 0;}" +
    "table{width:100%;border-collapse:collapse;}" +
    "td{padding:9px 4px;font-size:.88rem;}" +
    "td:first-child{color:#64748b;width:48%;}" +
    "td:last-child{font-weight:600;text-align:right;}" +
    ".badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:.75rem;font-weight:700;text-transform:capitalize;}" +
    ".footer{text-align:center;margin-top:28px;font-size:.75rem;color:#94a3b8;}" +
    "@media print{body{margin:0;}.page{border:none;margin:0;padding:24px;}}" +
    "</style></head><body>" +
    "<div class='page'>" +
    "<div class='header'><h1>&#127979; Payment Receipt</h1><p>Official Fee Payment Confirmation</p></div>" +
    "<hr class='divider'>" +
    "<table>" +
    "<tr><td>Student Name</td><td>" + name + "</td></tr>" +
    "<tr><td>EMIS Number</td><td>" + emis + "</td></tr>" +
    "<tr><td>Receipt No.</td><td>" + (p.receiptNo || "—") + "</td></tr>" +
    "<tr><td>Fee Type</td><td>" + feeName + "</td></tr>" +
    "<tr><td>Total Fee</td><td>" + feeTotal + "</td></tr>" +
    "<tr><td>Amount Paid</td><td style='color:#16a34a'>" + amountPaid + "</td></tr>" +
    "<tr><td>Balance</td><td style='color:#dc2626'>" + balance + "</td></tr>" +
    "<tr><td>Payment Method</td><td style='text-transform:capitalize'>" + method + "</td></tr>" +
    "<tr><td>Payment Date</td><td>" + (p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—") + "</td></tr>" +
    "<tr><td>Status</td><td><span class='badge' style='" + statusStyle + "'>" + status + "</span></td></tr>" +
    "</table>" +
    "<hr class='divider'>" +
    "<div class='footer'>Generated on " + new Date().toLocaleString() + " &mdash; Thank you!</div>" +
    "</div>" +
    "<script>window.onload=function(){window.print();}<\/script>" +
    "</body></html>";
  win.document.write(html);
  win.document.close();
}

/* ── tiny helpers ────────────────────────────────────────────────────────── */
function fmt(d, opts) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", opts || { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "—"; }
}

function gradeColor(g) {
  if (!g) return "badge-gray";
  if (g === "A+" || g === "A") return "badge-green";
  if (g === "B") return "badge-blue";
  if (g === "C") return "badge-gray";
  if (g === "F") return "badge-red";
  return "badge-gray";
}

function statusColor(s) {
  return s === "present" ? "badge-green" : s === "late" ? "badge-blue" : s === "excused" ? "badge-gray" : "badge-red";
}

/* ── Sub-components ──────────────────────────────────────────────────────── */
function Modal({ visible, onClose, title, children }) {
  if (!visible) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-scale">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 16 }}>
              <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: ".7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-muted)", marginBottom: 3 }}>{label}</div>
      <div style={{ fontWeight: 600, color: "var(--text)", fontSize: ".9rem" }}>
        {value || <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>—</span>}
      </div>
    </div>
  );
}

function SectionHead({ children }) {
  return (
    <div style={{ fontSize: ".72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--primary, #6366f1)", marginBottom: 14, marginTop: 4, paddingBottom: 8, borderBottom: "1px solid var(--border-light)" }}>
      {children}
    </div>
  );
}

function StatBox({ label, value, sub, color }) {
  return (
    <div style={{ background: "var(--surface, #f8fafc)", borderRadius: 10, padding: "16px 18px", textAlign: "center", border: "1px solid var(--border-light)" }}>
      <div style={{ fontSize: "1.6rem", fontWeight: 800, color: color || "var(--text)" }}>{value}</div>
      <div style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: ".68rem", color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

/* ── Tabs ────────────────────────────────────────────────────────────────── */
const TABS = [
  { id: "profile",    label: "👤 Profile" },
  { id: "results",    label: "📝 Exams & Results" },
  { id: "attendance", label: "✅ Attendance" },
  { id: "fees",       label: "💳 Fees" },
  { id: "history",    label: "📚 Enrollment History" },
];

/* ── Main Component ──────────────────────────────────────────────────────── */
export default function StudentProfile() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("profile");

  // Filter class
  const [selectedClass, setSelectedClass] = useState("");

  // Edit profile modal
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ phone: "", address: "", guardianName: "", guardianPhone: "" });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  // Change password modal
  const [showPwd, setShowPwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");

  async function load() {
    setError("");
    setLoading(true);
    try {
      const { data } = await api.get("/api/students/me");
      setProfileData(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load your profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openEdit() {
    if (!profileData?.student) return;
    const s = profileData.student;
    setEditForm({ phone: s.phone || "", address: s.address || "", guardianName: s.guardianName || "", guardianPhone: s.guardianPhone || "" });
    setEditError("");
    setEditSuccess("");
    setShowEdit(true);
  }

  async function saveProfile(e) {
    e.preventDefault();
    setEditError(""); setEditSuccess(""); setSaving(true);
    try {
      const { data } = await api.put("/api/students/me", editForm);
      setProfileData(p => ({ ...p, student: data.student }));
      setEditSuccess("Profile updated successfully!");
      setTimeout(() => { setShowEdit(false); setEditSuccess(""); }, 1200);
    } catch (err) {
      setEditError(err?.response?.data?.message || "Failed to update profile");
    } finally { setSaving(false); }
  }

  async function changePassword(e) {
    e.preventDefault();
    setPwdError(""); setPwdSuccess("");
    if (pwdForm.newPassword !== pwdForm.confirm) { setPwdError("New passwords do not match"); return; }
    if (pwdForm.newPassword.length < 6) { setPwdError("New password must be at least 6 characters"); return; }
    setPwdSaving(true);
    try {
      await api.put("/api/students/me", { currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword });
      setPwdSuccess("Password changed successfully!");
      setPwdForm({ currentPassword: "", newPassword: "", confirm: "" });
      setTimeout(() => { setShowPwd(false); setPwdSuccess(""); }, 1400);
    } catch (err) {
      setPwdError(err?.response?.data?.message || "Failed to change password");
    } finally { setPwdSaving(false); }
  }

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading your profile...</div>;
  if (error) return <div className="alert alert-error" style={{ margin: 32 }}>{error}</div>;
  if (!profileData) return null;

  const { student, results = [], attendance = [], attendanceStats = {}, feePayments = [], totalFeePaid = 0, enrollments = [], promotions = [] } = profileData;
  const fullName = `${student.firstName} ${student.lastName}`;
  const initials  = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();

  // Compute available class options
  const classOptions = useMemo(() => {
    const map = new Map();
    if (student?.classLevelId) {
      map.set(student.classLevelId._id, student.classLevelId.name);
    }
    enrollments.forEach(e => {
      if (e.classLevelId) map.set(e.classLevelId._id, e.classLevelId.name);
    });
    results.forEach(r => {
      if (r.subjectId?.classLevelId?._id) map.set(r.subjectId.classLevelId._id, r.subjectId.classLevelId.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [student, enrollments, results]);

  // Filter results
  const filteredResults = useMemo(() => {
    if (!selectedClass) return results;
    return results.filter(r => r.subjectId?.classLevelId?._id === selectedClass);
  }, [results, selectedClass]);

  // Group results by ExamTerm
  const resultsByTerm = useMemo(() => {
    return filteredResults.reduce((acc, r) => {
      const key = r.examTermId?._id || "unknown";
      if (!acc[key]) acc[key] = { term: r.examTermId, items: [] };
      acc[key].items.push(r);
      return acc;
    }, {});
  }, [filteredResults]);

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1>My Profile</h1>
          <p>View all your academic details, results, attendance, and more.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => setShowPwd(true)}>🔒 Change Password</button>
          <button className="btn btn-primary" onClick={openEdit}>✏️ Edit Profile</button>
        </div>
      </div>

      {/* ── Identity Hero ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#818cf8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text)" }}>{fullName}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <span className="badge badge-blue" style={{ fontFamily: "monospace" }}>{student.emisNumber ? `EMIS #${student.emisNumber}` : "No EMIS"}</span>
              <span className={`badge ${student.status === "active" ? "badge-green" : "badge-gray"}`} style={{ textTransform: "capitalize" }}>{student.status}</span>
              {student.classLevelId && <span className="badge badge-gray">{student.classLevelId.name}{student.sectionId ? ` — ${student.sectionId.name}` : ""}</span>}
              {student.academicYearId && <span className="badge badge-gray">{student.academicYearId.name}</span>}
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <StatBox label="Results" value={results.length} color="var(--primary,#6366f1)" />
            <StatBox label="Attendance" value={attendanceStats.percentage !== null ? `${attendanceStats.percentage}%` : "—"} sub={`${attendanceStats.present || 0}/${attendanceStats.total || 0} sessions`} color={attendanceStats.percentage >= 75 ? "#22c55e" : "#ef4444"} />
            <StatBox label="Fees Paid" value={`$${totalFeePaid.toLocaleString()}`} color="#f59e0b" />
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--border-light)", marginBottom: 20, overflowX: "auto" }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "10px 18px", background: "none", border: "none", cursor: "pointer",
              fontSize: ".82rem", fontWeight: 700, fontFamily: "inherit", whiteSpace: "nowrap",
              color: tab === t.id ? "var(--primary,#6366f1)" : "var(--text-muted)",
              borderBottom: `2.5px solid ${tab === t.id ? "var(--primary,#6366f1)" : "transparent"}`,
              marginBottom: -2, transition: "all .15s"
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════ TAB: PROFILE ══ */}
      {tab === "profile" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          <div className="card">
            <div className="card-header"><div className="card-title">Personal Information</div></div>
            <div className="card-body">
              <SectionHead>Basic Details</SectionHead>
              <Field label="First Name" value={student.firstName} />
              <Field label="Last Name" value={student.lastName} />
              <Field label="Gender" value={student.gender} />
              <Field label="Date of Birth" value={fmt(student.dateOfBirth)} />
              <Field label="Admission Date" value={fmt(student.admissionDate)} />
              <SectionHead>Contact</SectionHead>
              <Field label="Phone" value={student.phone} />
              <Field label="Address" value={student.address} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="card">
              <div className="card-header"><div className="card-title">Academic Placement</div></div>
              <div className="card-body">
                <Field label="Academic Year" value={student.academicYearId?.name} />
                <Field label="Class / Grade" value={student.classLevelId?.name} />
                <Field label="Section" value={student.sectionId?.name} />
              </div>
            </div>
            <div className="card">
              <div className="card-header"><div className="card-title">Guardian &amp; Emergency Contact</div></div>
              <div className="card-body">
                <SectionHead>Guardian</SectionHead>
                <Field label="Guardian Name" value={student.guardianName} />
                <Field label="Guardian Phone" value={student.guardianPhone} />
                <SectionHead>Emergency Contact</SectionHead>
                <Field label="Name" value={student.emergencyContactName} />
                <Field label="Phone" value={student.emergencyContactPhone} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════ TAB: RESULTS ══ */}
      {tab === "results" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Exam Results</h3>
            {results.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ fontSize: ".82rem", fontWeight: 600, color: "var(--text-muted)" }}>Class / Grade:</label>
                <select 
                  className="form-input" 
                  style={{ width: 120, padding: "4px 8px", fontSize: ".85rem" }}
                  value={selectedClass} 
                  onChange={e => setSelectedClass(e.target.value)}
                >
                  <option value="">All</option>
                  {classOptions.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {Object.keys(resultsByTerm).length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/></svg>
              <h3>No results found</h3>
              <p>{selectedClass ? `No subjects match the selected class.` : "Your results will appear here once your teacher enters them."}</p>
            </div>
          ) : (
            Object.values(resultsByTerm).map(({ term, items }) => {
              // Calculate overall stats from the original results
              const termAllItems = results.filter(r => (r.examTermId?._id || "unknown") === (term?._id || "unknown"));
              const avg = termAllItems.length > 0 ? Math.round(termAllItems.reduce((s, r) => s + (r.marksObtained / r.maxMarks) * 100, 0) / termAllItems.length) : 0;
              return (
                <div className="card" key={term?._id || "unknown"} style={{ marginBottom: 20 }}>
                  <div className="card-header">
                    <div>
                      <div className="card-title">{term?.name || "Unknown Exam"}</div>
                      <div className="card-subtitle">{term?.academicYearId?.name || ""} · Average: <strong>{avg}%</strong></div>
                    </div>
                    <span className={`badge ${term?.status === "completed" ? "badge-green" : term?.status === "ongoing" ? "badge-blue" : "badge-gray"}`} style={{ textTransform: "capitalize" }}>
                      {term?.status || "—"}
                    </span>
                  </div>
                  <div className="card-body" style={{ padding: 0 }}>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Subject</th>
                            <th>Code</th>
                            <th>Marks</th>
                            <th>Percentage</th>
                            <th>Grade</th>
                            <th>Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map(r => {
                            const pct = Math.round((r.marksObtained / r.maxMarks) * 100);
                            return (
                              <tr key={r._id}>
                                <td style={{ fontWeight: 600 }}>{r.subjectId?.name || "—"}</td>
                                <td className="td-muted" style={{ fontFamily: "monospace" }}>{r.subjectId?.code || "—"}</td>
                                <td className="td-muted">{r.marksObtained} / {r.maxMarks}</td>
                                <td>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <div style={{ width: 60, height: 6, borderRadius: 3, background: "var(--border-light)", overflow: "hidden" }}>
                                      <div style={{ width: `${pct}%`, height: "100%", background: pct >= 60 ? "#22c55e" : "#ef4444", borderRadius: 3 }} />
                                    </div>
                                    <span style={{ fontSize: ".8rem", fontWeight: 700 }}>{pct}%</span>
                                  </div>
                                </td>
                                <td><span className={`badge ${gradeColor(r.grade)}`}>{r.grade || "—"}</span></td>
                                <td className="td-muted">{r.remarks || "—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════ TAB: ATTENDANCE ══ */}
      {tab === "attendance" && (
        <div>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 14, marginBottom: 20 }}>
            <StatBox label="Total Sessions" value={attendanceStats.total || 0} />
            <StatBox label="Present" value={attendanceStats.present || 0} color="#22c55e" />
            <StatBox label="Late" value={attendanceStats.late || 0} color="#f59e0b" />
            <StatBox label="Excused" value={attendanceStats.excused || 0} color="#94a3b8" />
            <StatBox label="Absent" value={attendanceStats.absent || 0} color="#ef4444" />
            <StatBox label="Attendance %" value={attendanceStats.percentage !== null ? `${attendanceStats.percentage}%` : "—"} color={attendanceStats.percentage >= 75 ? "#22c55e" : "#ef4444"} />
          </div>

          {attendance.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4M2 12a10 10 0 1 0 20 0A10 10 0 0 0 2 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
              <h3>No attendance records</h3><p>Attendance records will appear here once taken.</p>
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Attendance Log</div>
                <div className="card-subtitle">{attendance.length} sessions recorded</div>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Date</th><th>Period</th><th>Class</th><th>Status</th><th>Note</th></tr>
                    </thead>
                    <tbody>
                      {attendance.slice(0, 50).map((a, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{fmt(a.date)}</td>
                          <td className="td-muted">{a.period || "—"}</td>
                          <td className="td-muted">{a.classLevel?.name || "—"}{a.section ? ` - ${a.section.name}` : ""}</td>
                          <td><span className={`badge ${statusColor(a.status)}`} style={{ textTransform: "capitalize" }}>{a.status}</span></td>
                          <td className="td-muted">{a.note || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════ TAB: FEES ══ */}
      {tab === "fees" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
            <StatBox label="Total Payments" value={feePayments.length} />
            <StatBox label="Total Paid" value={`$${totalFeePaid.toLocaleString()}`} color="#22c55e" />
          </div>

          {feePayments.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm-1 14v-2H9v-2h2v-1H9V9h2V7h2v2h2v2h-3v1h3v2h-2v2h-2Z"/></svg>
              <h3>No payment records</h3><p>Your fee payment records will appear here.</p>
            </div>
          ) : (
            <div className="card">
              <div className="card-header"><div className="card-title">Payment History</div></div>
              <div className="card-body" style={{ padding: 0 }}>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Fee Name</th><th>Amount Paid</th><th>Fee Amount</th><th>Payment Date</th><th>Method</th><th>Receipt</th><th>Status</th><th>Print</th></tr>
                    </thead>
                    <tbody>
                      {feePayments.map(p => (
                        <tr key={p._id}>
                          <td style={{ fontWeight: 600 }}>{p.feeStructureId?.name || "—"}</td>
                          <td style={{ color: "#22c55e", fontWeight: 700 }}>${p.amountPaid?.toLocaleString()}</td>
                          <td className="td-muted">${p.feeStructureId?.amount?.toLocaleString() || "—"}</td>
                          <td className="td-muted">{fmt(p.paymentDate)}</td>
                          <td className="td-muted" style={{ textTransform: "capitalize" }}>{p.method?.replace("_", " ") || "—"}</td>
                          <td className="td-muted" style={{ fontFamily: "monospace" }}>{p.receiptNo || "—"}</td>
                          <td><span className={`badge ${p.status === "paid" ? "badge-green" : p.status === "partial" ? "badge-blue" : "badge-red"}`} style={{ textTransform: "capitalize" }}>{p.status}</span></td>
                          <td><button onClick={() => printReceipt(p, student)} style={{ background: "none", border: "1px solid var(--border-light)", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: ".75rem", fontWeight: 600, color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: 4 }} title="Print Receipt">🖨️ Print</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════ TAB: ENROLLMENT HISTORY ══ */}
      {tab === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Enrollments */}
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
                      <tr><th>Academic Year</th><th>Class</th><th>Section</th><th>Roll No</th><th>Status</th><th>Enrolled On</th></tr>
                    </thead>
                    <tbody>
                      {enrollments.map(e => (
                        <tr key={e._id}>
                          <td style={{ fontWeight: 600 }}>{e.academicYearId?.name || "—"}</td>
                          <td className="td-muted">{e.classLevelId?.name || "—"}</td>
                          <td className="td-muted">{e.sectionId?.name || "—"}</td>
                          <td className="td-muted" style={{ fontFamily: "monospace" }}>{e.rollNo || "—"}</td>
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

          {/* Promotion Logs */}
          <div className="card">
            <div className="card-header"><div className="card-title">Promotion History</div><div className="card-subtitle">{promotions.length} records</div></div>
            <div className="card-body" style={{ padding: 0 }}>
              {promotions.length === 0 ? (
                <div className="empty-state" style={{ padding: 32 }}>
                  <h3 style={{ fontSize: "1rem" }}>No promotion records yet</h3>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Action</th><th>From Year</th><th>To Year</th><th>From Class</th><th>To Class</th><th>Reason</th><th>Date</th></tr>
                    </thead>
                    <tbody>
                      {promotions.map(p => (
                        <tr key={p._id}>
                          <td><span className={`badge ${p.action === "promoted" ? "badge-green" : p.action === "graduated" ? "badge-blue" : "badge-gray"}`} style={{ textTransform: "capitalize" }}>{p.action}</span></td>
                          <td className="td-muted">{p.fromAcademicYearId?.name || "—"}</td>
                          <td className="td-muted">{p.toAcademicYearId?.name || "—"}</td>
                          <td className="td-muted">{p.fromClassLevelId?.name || "—"}</td>
                          <td className="td-muted">{p.toClassLevelId?.name || "—"}</td>
                          <td className="td-muted">{p.reason || "—"}</td>
                          <td className="td-muted">{fmt(p.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Profile Modal ── */}
      <Modal visible={showEdit} onClose={() => setShowEdit(false)} title="Edit My Profile">
        <form onSubmit={saveProfile}>
          <div className="modal-body">
            {editError && <div className="alert alert-error" style={{ marginBottom: 12 }}>{editError}</div>}
            {editSuccess && <div className="alert alert-success" style={{ marginBottom: 12 }}>{editSuccess}</div>}
            <div className="alert alert-info" style={{ marginBottom: 14, fontSize: ".8rem" }}>
              You can update your contact and guardian information. Academic details can only be changed by an administrator.
            </div>
            <div className="form-grid form-grid-2" style={{ gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="form-input" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} placeholder="+1234567890" />
              </div>
              <div className="form-group">
                <label className="form-label">Guardian Name</label>
                <input className="form-input" value={editForm.guardianName} onChange={e => setEditForm(p => ({ ...p, guardianName: e.target.value }))} placeholder="John Doe" />
              </div>
              <div className="form-group">
                <label className="form-label">Guardian Phone</label>
                <input className="form-input" value={editForm.guardianPhone} onChange={e => setEditForm(p => ({ ...p, guardianPhone: e.target.value }))} placeholder="+0987654321" />
              </div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Home Address</label>
                <input className="form-input" value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} placeholder="123 Education Lane..." />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
          </div>
        </form>
      </Modal>

      {/* ── Change Password Modal ── */}
      <Modal visible={showPwd} onClose={() => setShowPwd(false)} title="Change Password">
        <form onSubmit={changePassword}>
          <div className="modal-body">
            {pwdError && <div className="alert alert-error" style={{ marginBottom: 12 }}>{pwdError}</div>}
            {pwdSuccess && <div className="alert alert-success" style={{ marginBottom: 12 }}>{pwdSuccess}</div>}
            <div className="form-grid" style={{ gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input type="password" className="form-input" value={pwdForm.currentPassword} onChange={e => setPwdForm(p => ({ ...p, currentPassword: e.target.value }))} placeholder="••••••••" required />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="form-input" value={pwdForm.newPassword} onChange={e => setPwdForm(p => ({ ...p, newPassword: e.target.value }))} placeholder="••••••••" required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input type="password" className="form-input" value={pwdForm.confirm} onChange={e => setPwdForm(p => ({ ...p, confirm: e.target.value }))} placeholder="••••••••" required />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowPwd(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={pwdSaving}>{pwdSaving ? "Changing..." : "Change Password"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
