import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { auth } from "../lib/auth";

const BACKEND = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* ─────────────────────────────────────────────── helpers ── */
function fmt(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "—"; }
}
function gradeColor(g) {
  if (!g) return "badge-gray";
  if (g === "A+" || g === "A") return "badge-green";
  if (g === "B") return "badge-blue";
  if (g === "F") return "badge-red";
  return "badge-gray";
}
function statusColor(s) {
  return s === "present" ? "badge-green" : s === "late" ? "badge-blue" : s === "excused" ? "badge-gray" : "badge-red";
}

/* ─────────────────────────────────────────────── Modal ── */
function Modal({ visible, onClose, title, size, children }) {
  if (!visible) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal animate-scale ${size || ""}`}>
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

/* ─────────────────────────────────────────── StatBox ── */
function StatBox({ label, value, sub, color }) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "14px 16px", textAlign: "center", border: "1px solid var(--border-light)" }}>
      <div style={{ fontSize: "1.4rem", fontWeight: 800, color: color || "var(--text)" }}>{value}</div>
      <div style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: ".65rem", color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────── InfoField ── */
function InfoField({ label, value }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: ".68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-muted)", marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 600, color: "var(--text)", fontSize: ".88rem" }}>
        {value || <span style={{ color: "var(--text-light)", fontWeight: 400 }}>—</span>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────── Profile Drawer Tabs ── */
const PROFILE_TABS = [
  { id: "profile",    label: "👤 Profile" },
  { id: "results",    label: "📝 Results" },
  { id: "attendance", label: "✅ Attendance" },
  { id: "fees",       label: "💳 Fees" },
  { id: "history",    label: "📚 History" },
];

/* ─────────────────────────────────────── ProfileDrawer ── */
function ProfileDrawer({ studentId, onClose }) {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [tab, setTab]           = useState("profile");

  useEffect(() => {
    if (!studentId) return;
    setLoading(true); setError(""); setData(null); setTab("profile");
    api.get(`/api/students/${studentId}`)
      .then(r => setData(r.data))
      .catch(e => setError(e?.response?.data?.message || "Failed to load profile"))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (!studentId) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      display: "flex", justifyContent: "flex-end",
    }}>
      {/* backdrop */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)" }}
        onClick={onClose} />

      {/* drawer */}
      <div style={{
        position: "relative", width: "min(780px, 96vw)",
        background: "var(--bg)", height: "100vh",
        overflowY: "auto", boxShadow: "-8px 0 40px rgba(0,0,0,.2)",
        display: "flex", flexDirection: "column",
        animation: "slideDrawer .25s cubic-bezier(.4,0,.2,1) both",
      }}>
        <style>{`@keyframes slideDrawer{from{transform:translateX(100%);}to{transform:none;}}`}</style>

        {/* Drawer header */}
        <div style={{ padding: "20px 24px 0", background: "var(--surface)", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontSize: "1rem", fontWeight: 700 }}>Student Profile</div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 8, border: "none", background: "var(--bg)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text-muted)",
            }}>
              <svg viewBox="0 0 24 24" fill="none" style={{ width: 16 }}>
                <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, overflowX: "auto" }}>
            {PROFILE_TABS.filter(t => auth.getUser()?.role === "Admin" || t.id !== "fees").map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "8px 14px", background: "none", border: "none", cursor: "pointer",
                fontSize: ".78rem", fontWeight: 700, fontFamily: "inherit", whiteSpace: "nowrap",
                color: tab === t.id ? "var(--primary)" : "var(--text-muted)",
                borderBottom: `2.5px solid ${tab === t.id ? "var(--primary)" : "transparent"}`,
                marginBottom: -1, transition: "all .15s",
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Drawer body */}
        <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
          {loading && <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>Loading profile…</div>}
          {error   && <div className="alert alert-error">{error}</div>}
          {data    && <DrawerContent data={data} tab={tab} />}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────── Drawer content switch ── */
function DrawerContent({ data, tab }) {
  const { student, results = [], attendance = [], attendanceStats = {}, feePayments = [], totalFeePaid = 0, enrollments = [], promotions = [] } = data;
  const initials = `${student.firstName?.[0] || ""}${student.lastName?.[0] || ""}`.toUpperCase();
  const photo    = student.photo ? `${BACKEND}${student.photo}` : null;

  // ── Hero ──────────────────────────────────────────────────────────────────
  const hero = (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card-body" style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        {photo
          ? <img src={photo} alt={student.firstName} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--border)", flexShrink: 0 }} />
          : <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#818cf8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initials}</div>
        }
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 800 }}>{student.firstName} {student.lastName}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
            <span className="badge badge-blue" style={{ fontFamily: "monospace" }}>{student.emisNumber ? `EMIS #${student.emisNumber}` : "No EMIS"}</span>
            <span className={`badge ${student.status === "active" ? "badge-green" : "badge-gray"}`} style={{ textTransform: "capitalize" }}>{student.status}</span>
            {student.classLevelId && <span className="badge badge-gray">{student.classLevelId.name}{student.sectionId ? ` — ${student.sectionId.name}` : ""}</span>}
            {student.academicYearId && <span className="badge badge-gray">{student.academicYearId.name}</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <StatBox label="Results" value={results.length} color="var(--primary)" />
          <StatBox label="Attendance" value={attendanceStats.percentage != null ? `${attendanceStats.percentage}%` : "—"} sub={`${attendanceStats.present || 0}/${attendanceStats.total || 0}`} color={attendanceStats.percentage >= 75 ? "#22c55e" : "#ef4444"} />
          <StatBox label="Fees Paid" value={`$${totalFeePaid.toLocaleString()}`} color="#f59e0b" />
        </div>
      </div>
    </div>
  );

  // ── TAB: Profile ──────────────────────────────────────────────────────────
  if (tab === "profile") return (
    <div>
      {hero}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        <div className="card">
          <div className="card-header"><div className="card-title">Personal Details</div></div>
          <div className="card-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
              <InfoField label="First Name" value={student.firstName} />
              <InfoField label="Last Name" value={student.lastName} />
              <InfoField label="Gender" value={student.gender} />
              <InfoField label="Date of Birth" value={fmt(student.dateOfBirth)} />
              <InfoField label="Admission Date" value={fmt(student.admissionDate)} />
              <InfoField label="Phone" value={student.phone} />
              <InfoField label="EMIS Number" value={student.emisNumber} />
              <InfoField label="Email" value={student.studentUserId?.email} />
            </div>
            <InfoField label="Address" value={student.address} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card">
            <div className="card-header"><div className="card-title">Academic Placement</div></div>
            <div className="card-body">
              <InfoField label="Academic Year" value={student.academicYearId?.name} />
              <InfoField label="Class / Grade" value={student.classLevelId?.name} />
              <InfoField label="Section" value={student.sectionId?.name} />
              <InfoField label="Status" value={<span className={`badge ${student.status === "active" ? "badge-green" : "badge-gray"}`} style={{ textTransform: "capitalize" }}>{student.status}</span>} />
            </div>
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title">Guardian & Emergency</div></div>
            <div className="card-body">
              <InfoField label="Guardian Name" value={student.guardianName} />
              <InfoField label="Guardian Phone" value={student.guardianPhone} />
              <InfoField label="Emergency Contact" value={student.emergencyContactName} />
              <InfoField label="Emergency Phone" value={student.emergencyContactPhone} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── TAB: Results ─────────────────────────────────────────────────────────
  if (tab === "results") {
    const byTerm = results.reduce((acc, r) => {
      const key = r.examTermId?._id || "unknown";
      if (!acc[key]) acc[key] = { term: r.examTermId, items: [] };
      acc[key].items.push(r); return acc;
    }, {});
    return (
      <div>
        {hero}
        {Object.keys(byTerm).length === 0
          ? <div className="empty-state"><h3>No results yet</h3><p>Results will appear once entered by the teacher.</p></div>
          : Object.values(byTerm).map(({ term, items }) => {
              const avg = items.length > 0 ? Math.round(items.reduce((s, r) => s + (r.marksObtained / r.maxMarks) * 100, 0) / items.length) : 0;
              return (
                <div className="card" key={term?._id || "uk"} style={{ marginBottom: 16 }}>
                  <div className="card-header">
                    <div><div className="card-title">{term?.name || "Unknown"}</div><div className="card-subtitle">Avg: {avg}%</div></div>
                    <span className={`badge ${term?.status === "completed" ? "badge-green" : "badge-blue"}`} style={{ textTransform: "capitalize" }}>{term?.status || "—"}</span>
                  </div>
                  <div className="card-body" style={{ padding: 0 }}>
                    <div className="table-wrap">
                      <table>
                        <thead><tr><th>Subject</th><th>Code</th><th>Marks</th><th>%</th><th>Grade</th></tr></thead>
                        <tbody>
                          {items.map(r => {
                            const pct = Math.round((r.marksObtained / r.maxMarks) * 100);
                            return (
                              <tr key={r._id}>
                                <td style={{ fontWeight: 600 }}>{r.subjectId?.name || "—"}</td>
                                <td className="td-muted" style={{ fontFamily: "monospace" }}>{r.subjectId?.code || "—"}</td>
                                <td className="td-muted">{r.marksObtained}/{r.maxMarks}</td>
                                <td>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <div style={{ width: 50, height: 5, borderRadius: 3, background: "var(--border-light)", overflow: "hidden" }}>
                                      <div style={{ width: `${pct}%`, height: "100%", background: pct >= 60 ? "#22c55e" : "#ef4444" }} />
                                    </div>
                                    <span style={{ fontSize: ".78rem", fontWeight: 700 }}>{pct}%</span>
                                  </div>
                                </td>
                                <td><span className={`badge ${gradeColor(r.grade)}`}>{r.grade || "—"}</span></td>
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
        }
      </div>
    );
  }

  // ── TAB: Attendance ───────────────────────────────────────────────────────
  if (tab === "attendance") return (
    <div>
      {hero}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 10, marginBottom: 16 }}>
        <StatBox label="Total" value={attendanceStats.total || 0} />
        <StatBox label="Present" value={attendanceStats.present || 0} color="#22c55e" />
        <StatBox label="Late" value={attendanceStats.late || 0} color="#f59e0b" />
        <StatBox label="Excused" value={attendanceStats.excused || 0} color="#94a3b8" />
        <StatBox label="Absent" value={attendanceStats.absent || 0} color="#ef4444" />
        <StatBox label="Rate" value={attendanceStats.percentage != null ? `${attendanceStats.percentage}%` : "—"} color={attendanceStats.percentage >= 75 ? "#22c55e" : "#ef4444"} />
      </div>
      {attendance.length === 0
        ? <div className="empty-state"><h3>No attendance records</h3></div>
        : <div className="card"><div className="card-body" style={{ padding: 0 }}><div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Period</th><th>Class</th><th>Status</th><th>Note</th></tr></thead>
              <tbody>
                {attendance.slice(0, 60).map((a, i) => (
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
          </div></div></div>
      }
    </div>
  );

  // ── TAB: Fees ─────────────────────────────────────────────────────────────
  if (tab === "fees") return (
    <div>
      {hero}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <StatBox label="Payments" value={feePayments.length} />
        <StatBox label="Total Paid" value={`$${totalFeePaid.toLocaleString()}`} color="#22c55e" />
      </div>
      {feePayments.length === 0
        ? <div className="empty-state"><h3>No fee records</h3></div>
        : <div className="card"><div className="card-body" style={{ padding: 0 }}><div className="table-wrap">
            <table>
              <thead><tr><th>Fee</th><th>Paid</th><th>Total</th><th>Date</th><th>Method</th><th>Status</th></tr></thead>
              <tbody>
                {feePayments.map(p => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: 600 }}>{p.feeStructureId?.name || "—"}</td>
                    <td style={{ color: "#22c55e", fontWeight: 700 }}>${p.amountPaid?.toLocaleString()}</td>
                    <td className="td-muted">${p.feeStructureId?.amount?.toLocaleString() || "—"}</td>
                    <td className="td-muted">{fmt(p.paymentDate)}</td>
                    <td className="td-muted" style={{ textTransform: "capitalize" }}>{p.method?.replace("_", " ") || "—"}</td>
                    <td><span className={`badge ${p.status === "paid" ? "badge-green" : p.status === "partial" ? "badge-blue" : "badge-red"}`} style={{ textTransform: "capitalize" }}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div></div>
      }
    </div>
  );

  // ── TAB: History ──────────────────────────────────────────────────────────
  if (tab === "history") return (
    <div>
      {hero}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><div className="card-title">Enrollment History</div><div className="card-subtitle">{enrollments.length} records</div></div>
        <div className="card-body" style={{ padding: 0 }}>
          {enrollments.length === 0 ? <div className="empty-state" style={{ padding: 32 }}><h3 style={{ fontSize: "1rem" }}>No enrollment records</h3></div>
            : <div className="table-wrap"><table>
                <thead><tr><th>Year</th><th>Class</th><th>Section</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {enrollments.map(e => (
                    <tr key={e._id}>
                      <td style={{ fontWeight: 600 }}>{e.academicYearId?.name || "—"}</td>
                      <td className="td-muted">{e.classLevelId?.name || "—"}</td>
                      <td className="td-muted">{e.sectionId?.name || "—"}</td>
                      <td><span className={`badge ${e.status === "active" ? "badge-green" : "badge-gray"}`} style={{ textTransform: "capitalize" }}>{e.status}</span></td>
                      <td className="td-muted">{fmt(e.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
          }
        </div>
      </div>
      <div className="card">
        <div className="card-header"><div className="card-title">Promotion History</div><div className="card-subtitle">{promotions.length} records</div></div>
        <div className="card-body" style={{ padding: 0 }}>
          {promotions.length === 0 ? <div className="empty-state" style={{ padding: 32 }}><h3 style={{ fontSize: "1rem" }}>No promotions yet</h3></div>
            : <div className="table-wrap"><table>
                <thead><tr><th>Action</th><th>From</th><th>To Class</th><th>Date</th></tr></thead>
                <tbody>
                  {promotions.map(p => (
                    <tr key={p._id}>
                      <td><span className={`badge ${p.action === "promoted" ? "badge-green" : p.action === "graduated" ? "badge-blue" : "badge-gray"}`} style={{ textTransform: "capitalize" }}>{p.action}</span></td>
                      <td className="td-muted">{p.fromClassLevelId?.name || "—"} → {p.toClassLevelId?.name || "—"}</td>
                      <td className="td-muted">{p.fromAcademicYearId?.name || "—"} → {p.toAcademicYearId?.name || "—"}</td>
                      <td className="td-muted">{fmt(p.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
          }
        </div>
      </div>
    </div>
  );

  return null;
}

/* ═══════════════════════════════════════════════════════════════ MAIN PAGE ══ */
const EDIT_FIELDS_INIT = {
  firstName: "", lastName: "", gender: "Male",
  dateOfBirth: "", admissionDate: "", phone: "", address: "", emisNumber: "",
  guardianName: "", guardianPhone: "", emergencyContactName: "", emergencyContactPhone: "",
  academicYearId: "", classLevelId: "", sectionId: "", status: "active",
};

export default function Students() {
  const navigate = useNavigate();
  const user = auth.getUser();
  const isAdmin = user?.role === "Admin";

  // List state
  const [data, setData]             = useState({ items: [], page: 1, pages: 1, total: 0, limit: 10 });
  const [q, setQ]                   = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [listError, setListError]   = useState("");

  // Lookups
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses]             = useState([]);
  const [sections, setSections]           = useState([]);

  // Profile drawer
  const [profileId, setProfileId]   = useState(null);

  // Edit modal
  const [editStudent, setEditStudent] = useState(null); // full student object being edited
  const [editForm, setEditForm]       = useState(EDIT_FIELDS_INIT);
  const [editSaving, setEditSaving]   = useState(false);
  const [editError, setEditError]     = useState("");

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null); // { _id, firstName, lastName }
  const [deleting, setDeleting]         = useState(false);
  const [deleteError, setDeleteError]   = useState("");

  const editFilteredSections = useMemo(
    () => sections.filter(s => (s.classLevelId?._id || s.classLevelId) === editForm.classLevelId),
    [sections, editForm.classLevelId]
  );

  /* ── load list ── */
  const load = useCallback(async (pg = 1, search = "", cls = "", st = "") => {
    setListError(""); setLoading(true);
    try {
      const params = { page: pg, limit: 10 };
      if (search) params.q = search;
      if (cls) params.classLevelId = cls;
      if (st) params.status = st;
      const { data: d } = await api.get("/api/students", { params });
      setData(d);
    } catch (err) {
      setListError(err?.response?.data?.message || "Failed to load students");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load(1, "", "", "");
    Promise.all([api.get("/api/academic-years"), api.get("/api/classes"), api.get("/api/sections")])
      .then(([yR, cR, sR]) => {
        setAcademicYears(yR.data); setClasses(cR.data); setSections(sR.data);
      }).catch(console.error);
  }, [load]);

  function search(e) { e?.preventDefault(); setPage(1); load(1, q, classFilter, statusFilter); }
  function clearFilters() { setQ(""); setClassFilter(""); setStatusFilter(""); setPage(1); load(1, "", "", ""); }
  function goto(p) { const n = Math.min(Math.max(p, 1), data.pages || 1); setPage(n); load(n, q, classFilter, statusFilter); }

  /* ── open edit ── */
  function openEdit(s) {
    setEditStudent(s);
    setEditForm({
      firstName: s.firstName || "", lastName: s.lastName || "",
      gender: s.gender || "Male",
      dateOfBirth: s.dateOfBirth ? s.dateOfBirth.slice(0, 10) : "",
      admissionDate: s.admissionDate ? s.admissionDate.slice(0, 10) : "",
      phone: s.phone || "", address: s.address || "",
      emisNumber: s.emisNumber || "",
      guardianName: s.guardianName || "", guardianPhone: s.guardianPhone || "",
      emergencyContactName: s.emergencyContactName || "", emergencyContactPhone: s.emergencyContactPhone || "",
      academicYearId: s.academicYearId?._id || s.academicYearId || "",
      classLevelId: s.classLevelId?._id || s.classLevelId || "",
      sectionId: s.sectionId?._id || s.sectionId || "",
      status: s.status || "active",
    });
    setEditError("");
  }

  /* ── save edit ── */
  async function saveEdit(e) {
    e.preventDefault();
    if (!editForm.firstName.trim() || !editForm.lastName.trim()) { setEditError("First and Last Name are required"); return; }
    setEditSaving(true); setEditError("");
    try {
      await api.put(`/api/students/${editStudent._id}`, editForm);
      setEditStudent(null);
      load(page, q, classFilter, statusFilter);
    } catch (err) {
      setEditError(err?.response?.data?.message || "Failed to update student");
    } finally { setEditSaving(false); }
  }

  /* ── delete ── */
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true); setDeleteError("");
    try {
      await api.delete(`/api/students/${deleteTarget._id}`);
      setDeleteTarget(null);
      load(page, q, classFilter, statusFilter);
    } catch (err) {
      setDeleteError(err?.response?.data?.message || "Failed to delete student");
    } finally { setDeleting(false); }
  }

  const hasFilters = q || classFilter || statusFilter;

  return (
    <div>
      <div className="page-header">
        <h1>Students Directory</h1>
        <p>Manage students — view profiles, edit details, and control enrolments.</p>
        {listError && <div className="alert alert-error" style={{ marginTop: 16 }}>{listError}</div>}
      </div>

      <div className="card">
        {/* ── Toolbar ── */}
        <div className="card-header" style={{ flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="card-title">All Students</div>
            <div className="card-subtitle">{data.total} registered in system</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", flex: 1, justifyContent: "flex-end" }}>
            <form onSubmit={search} className="search-wrap" style={{ minWidth: 220 }}>
              <svg className="search-icon" viewBox="0 0 24 24" fill="none"><path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Name, EMIS No, or Email…" />
            </form>
            <select className="form-select" style={{ minWidth: 140, padding: "7px 10px", fontSize: ".82rem" }} value={classFilter}
              onChange={e => { setClassFilter(e.target.value); setPage(1); load(1, q, e.target.value, statusFilter); }}>
              <option value="">All Classes</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <select className="form-select" style={{ minWidth: 120, padding: "7px 10px", fontSize: ".82rem" }} value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); load(1, q, classFilter, e.target.value); }}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="graduated">Graduated</option>
              <option value="suspended">Suspended</option>
              <option value="transferred">Transferred</option>
              <option value="expelled">Expelled</option>
            </select>
            {hasFilters && <button className="btn btn-secondary btn-sm" onClick={clearFilters}>Clear</button>}
            {isAdmin && <button className="btn btn-primary btn-sm" onClick={() => navigate("/students/register")}>
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 15 }}><path d="M12 5v14M5 12h14"/></svg>
              Register Student
            </button>}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>Loading…</div>
          ) : data.items.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z" stroke="currentColor" strokeWidth="2"/></svg>
              <h3>No students found</h3><p>Adjust your search or register a new student.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>EMIS No</th>
                    <th>Email</th>
                    <th>Class</th>
                    <th>Gender</th>
                    <th>Status</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map(s => (
                    <tr key={s._id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          {s.photo
                            ? <img src={`${BACKEND}${s.photo}`} alt={s.firstName} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid var(--border-light)" }} />
                            : <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#eef2ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".78rem", fontWeight: 700, flexShrink: 0 }}>
                                {s.firstName?.[0]}{s.lastName?.[0]}
                              </div>
                          }
                          <div>
                            <div style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</div>
                            {s.guardianName && <div className="td-muted" style={{ fontSize: ".7rem" }}>Grd: {s.guardianName}</div>}
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-blue" style={{ fontFamily: "monospace" }}>{s.emisNumber || "—"}</span></td>
                      <td className="td-muted" style={{ fontSize: ".78rem" }}>{s.studentUserId?.email || "—"}</td>
                      <td className="td-muted">{s.classLevelId?.name || "—"}{s.sectionId?.name ? ` — ${s.sectionId.name}` : ""}</td>
                      <td className="td-muted">{s.gender}</td>
                      <td>
                        <span className={`badge ${s.status === "active" ? "badge-green" : s.status === "graduated" ? "badge-blue" : s.status === "transferred" ? "badge-gray" : "badge-red"}`} style={{ textTransform: "capitalize" }}>
                          {s.status || "Active"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "nowrap" }}>
                          {/* Profile */}
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => navigate(`/students/${s._id}`)}
                            title="View full profile"
                            style={{ gap: 4 }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" style={{ width: 13 }}><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9a8 8 0 1 1 16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                            Profile
                          </button>
                          {/* Edit */}
                          {isAdmin && <button
                            className="btn btn-sm"
                            onClick={() => openEdit(s)}
                            title="Edit student"
                            style={{ background: "var(--primary-bg)", color: "var(--primary)", border: "1px solid #a5b4fc", gap: 4 }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" style={{ width: 13 }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                            Edit
                          </button>}
                          {/* Delete */}
                          {isAdmin && <button
                            className="btn btn-sm btn-danger"
                            onClick={() => { setDeleteError(""); setDeleteTarget(s); }}
                            title="Delete student"
                            style={{ gap: 4 }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" style={{ width: 13 }}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                            Delete
                          </button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {data.pages > 1 && (
                <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-light)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div className="td-muted">
                    Showing {(data.page - 1) * data.limit + 1}–{Math.min(data.page * data.limit, data.total)} of {data.total}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" disabled={data.page <= 1} onClick={() => goto(data.page - 1)}>Prev</button>
                    <span style={{ padding: "6px 12px", fontSize: ".8rem", fontWeight: 600 }}>{data.page} / {data.pages}</span>
                    <button className="btn btn-secondary btn-sm" disabled={data.page >= data.pages} onClick={() => goto(data.page + 1)}>Next</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════ PROFILE DRAWER ══ */}
      <ProfileDrawer studentId={profileId} onClose={() => setProfileId(null)} />

      {/* ══════════════════════════════ EDIT MODAL ══ */}
      <Modal visible={!!editStudent} onClose={() => setEditStudent(null)} title={`Edit — ${editForm.firstName} ${editForm.lastName}`} size="modal-lg">
        <form onSubmit={saveEdit}>
          <div className="modal-body" style={{ maxHeight: "72vh", overflowY: "auto" }}>
            {editError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{editError}</div>}

            <p style={{ fontSize: ".75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-muted)", marginBottom: 16 }}>Personal Info</p>
            <div className="form-grid form-grid-3" style={{ gap: 14, marginBottom: 24 }}>
              <div className="form-group"><label className="form-label">First Name <span style={{ color: "var(--danger)" }}>*</span></label><input name="firstName" className="form-input" value={editForm.firstName} onChange={e => setEditForm(p => ({ ...p, firstName: e.target.value }))} required /></div>
              <div className="form-group"><label className="form-label">Last Name <span style={{ color: "var(--danger)" }}>*</span></label><input name="lastName" className="form-input" value={editForm.lastName} onChange={e => setEditForm(p => ({ ...p, lastName: e.target.value }))} required /></div>
              <div className="form-group"><label className="form-label">Gender</label>
                <select className="form-select" value={editForm.gender} onChange={e => setEditForm(p => ({ ...p, gender: e.target.value }))}>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">EMIS Number</label><input className="form-input" value={editForm.emisNumber} onChange={e => setEditForm(p => ({ ...p, emisNumber: e.target.value }))} placeholder="e.g. 20240001" /></div>
              <div className="form-group"><label className="form-label">Date of Birth</label><input type="date" className="form-input" value={editForm.dateOfBirth} onChange={e => setEditForm(p => ({ ...p, dateOfBirth: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Admission Date</label><input type="date" className="form-input" value={editForm.admissionDate} onChange={e => setEditForm(p => ({ ...p, admissionDate: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Status</label>
                <select className="form-select" value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="graduated">Graduated</option>
                  <option value="transferred">Transferred</option>
                  <option value="expelled">Expelled</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} placeholder="+1234567890" /></div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}><label className="form-label">Home Address</label><input className="form-input" value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} placeholder="123 Education Lane…" /></div>
            </div>

            <p style={{ fontSize: ".75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-muted)", marginBottom: 16 }}>Guardian & Emergency</p>
            <div className="form-grid form-grid-2" style={{ gap: 14, marginBottom: 24 }}>
              <div className="form-group"><label className="form-label">Guardian Name</label><input className="form-input" value={editForm.guardianName} onChange={e => setEditForm(p => ({ ...p, guardianName: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Guardian Phone</label><input className="form-input" value={editForm.guardianPhone} onChange={e => setEditForm(p => ({ ...p, guardianPhone: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Emergency Contact Name</label><input className="form-input" value={editForm.emergencyContactName} onChange={e => setEditForm(p => ({ ...p, emergencyContactName: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Emergency Contact Phone</label><input className="form-input" value={editForm.emergencyContactPhone} onChange={e => setEditForm(p => ({ ...p, emergencyContactPhone: e.target.value }))} /></div>
            </div>

            <p style={{ fontSize: ".75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-muted)", marginBottom: 16 }}>Class Placement</p>
            <div className="form-grid form-grid-3" style={{ gap: 14 }}>
              <div className="form-group"><label className="form-label">Academic Year</label>
                <select className="form-select" value={editForm.academicYearId} onChange={e => setEditForm(p => ({ ...p, academicYearId: e.target.value }))}>
                  <option value="">None</option>
                  {academicYears.map(y => <option key={y._id} value={y._id}>{y.name}{y.status === "active" ? " (Active)" : ""}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Class</label>
                <select className="form-select" value={editForm.classLevelId} onChange={e => setEditForm(p => ({ ...p, classLevelId: e.target.value, sectionId: "" }))}>
                  <option value="">None</option>
                  {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Section</label>
                <select className="form-select" value={editForm.sectionId} onChange={e => setEditForm(p => ({ ...p, sectionId: e.target.value }))} disabled={editFilteredSections.length === 0}>
                  <option value="">No Section</option>
                  {editFilteredSections.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setEditStudent(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={editSaving}>{editSaving ? "Saving…" : "Save Changes"}</button>
          </div>
        </form>
      </Modal>

      {/* ══════════════════════════════ DELETE CONFIRM ══ */}
      <Modal visible={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} title="Delete Student" size="modal-sm">
        <div className="modal-body">
          {deleteError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{deleteError}</div>}
          <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--danger-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "1.6rem" }}>🗑️</div>
            <p style={{ fontSize: ".92rem", fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
              Delete <strong>{deleteTarget?.firstName} {deleteTarget?.lastName}</strong>?
            </p>
            <p style={{ fontSize: ".8rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              This will permanently remove the student's account, all exam results, fee records, attendances, and enrollment history. <strong>This cannot be undone.</strong>
            </p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
          <button className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
            {deleting ? "Deleting…" : "Yes, Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}