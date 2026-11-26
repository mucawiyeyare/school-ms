import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

const BACKEND = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* ─────────────────────────────────────────── helpers ── */
function fmt(d, short) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-GB",
      short
        ? { day: "2-digit", month: "short" }
        : { day: "2-digit", month: "short", year: "numeric" }
    );
  } catch { return "—"; }
}

function gradeColor(g) {
  if (!g) return "badge-gray";
  if (g === "A+" || g === "A") return "badge-green";
  if (g === "B") return "badge-blue";
  if (g === "F") return "badge-red";
  return "badge-gray";
}

function attColor(s) {
  return s === "present" ? "badge-green" : s === "late" ? "badge-blue" : s === "excused" ? "badge-gray" : "badge-red";
}

/* ─────────────────────────────────────── sub-components ── */
function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
      <span style={{
        fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase",
        letterSpacing: ".07em", color: "var(--text-muted)",
      }}>{label}</span>
      <span style={{ fontWeight: 600, color: "var(--text)", fontSize: ".88rem", wordBreak: "break-word" }}>
        {value ?? <span style={{ color: "var(--text-light)", fontWeight: 400 }}>—</span>}
      </span>
    </div>
  );
}

function SectionDivider({ children }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      margin: "20px 0 16px",
    }}>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      <span style={{
        fontSize: ".68rem", fontWeight: 700, textTransform: "uppercase",
        letterSpacing: ".08em", color: "var(--text-muted)", whiteSpace: "nowrap",
      }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 14, padding: "18px 20px",
      display: "flex", alignItems: "center", gap: 14,
      boxShadow: "var(--shadow-sm)", transition: "all .2s",
    }}
      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
      onMouseLeave={e => e.currentTarget.style.transform = ""}
    >
      <div style={{
        width: 46, height: 46, borderRadius: 12, flexShrink: 0,
        background: accent + "22", display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: "1.3rem",
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: accent, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: ".76rem", fontWeight: 600, color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: ".67rem", color: "var(--text-light)", marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────── Tabs ── */
const TABS = [
  { id: "overview",   label: "Overview",            icon: "🏠" },
  { id: "results",    label: "Exams & Results",      icon: "📝" },
  { id: "attendance", label: "Attendance",           icon: "✅" },
  { id: "fees",       label: "Fee Payments",         icon: "💳" },
  { id: "history",    label: "Enrollment History",   icon: "📚" },
];

/* ══════════════════════════════════════════════ MAIN PAGE ══ */
export default function AdminStudentProfile() {
  const { id }    = useParams();
  const navigate  = useNavigate();

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [tab, setTab]         = useState("overview");

  // Edit inline
  const [editMode, setEditMode]     = useState(false);
  const [editForm, setEditForm]     = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError]   = useState("");
  const [editOk, setEditOk]         = useState("");

  // Lookups for edit
  const [academicYears, setAcadYears] = useState([]);
  const [classes, setClasses]         = useState([]);
  const [sections, setSections]       = useState([]);
  const [lookupsLoaded, setLookupsLoaded] = useState(false);

  const editSections = useMemo(
    () => sections.filter(s => (s.classLevelId?._id || s.classLevelId) === editForm.classLevelId),
    [sections, editForm.classLevelId]
  );

  /* ── fetch profile ── */
  async function loadProfile() {
    setLoading(true); setError("");
    try {
      const { data: d } = await api.get(`/api/students/${id}`);
      setData(d);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load student profile");
    } finally { setLoading(false); }
  }

  useEffect(() => { loadProfile(); }, [id]);

  /* ── Results grouped by term (must be before any early return) ── */
  const resultsByTerm = useMemo(() => {
    const results = data?.results || [];
    return results.reduce((acc, r) => {
      const key = r.examTermId?._id || "unknown";
      if (!acc[key]) acc[key] = { term: r.examTermId, items: [] };
      acc[key].items.push(r);
      return acc;
    }, {});
  }, [data?.results]);

  /* ── load lookups lazily when edit opened ── */
  async function openEdit() {
    if (!lookupsLoaded) {
      const [yR, cR, sR] = await Promise.all([
        api.get("/api/academic-years"),
        api.get("/api/classes"),
        api.get("/api/sections"),
      ]);
      setAcadYears(yR.data); setClasses(cR.data); setSections(sR.data);
      setLookupsLoaded(true);
    }
    const s = data.student;
    setEditForm({
      firstName: s.firstName || "", lastName: s.lastName || "",
      gender: s.gender || "Male",
      dateOfBirth: s.dateOfBirth ? s.dateOfBirth.slice(0, 10) : "",
      admissionDate: s.admissionDate ? s.admissionDate.slice(0, 10) : "",
      phone: s.phone || "", address: s.address || "",
      emisNumber: s.emisNumber || "",
      guardianName: s.guardianName || "", guardianPhone: s.guardianPhone || "",
      emergencyContactName: s.emergencyContactName || "",
      emergencyContactPhone: s.emergencyContactPhone || "",
      academicYearId: s.academicYearId?._id || s.academicYearId || "",
      classLevelId:   s.classLevelId?._id   || s.classLevelId   || "",
      sectionId:      s.sectionId?._id      || s.sectionId      || "",
      status: s.status || "active",
    });
    setEditError(""); setEditOk(""); setEditMode(true);
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (!editForm.firstName.trim() || !editForm.lastName.trim()) {
      setEditError("First and Last Name are required"); return;
    }
    setEditSaving(true); setEditError(""); setEditOk("");
    try {
      await api.put(`/api/students/${id}`, editForm);
      setEditOk("✅ Saved successfully!");
      setEditMode(false);
      loadProfile();
    } catch (err) {
      setEditError(err?.response?.data?.message || "Failed to save");
    } finally { setEditSaving(false); }
  }

  /* ── Loading / Error states ── */
  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
      <div style={{ width: 48, height: 48, border: "4px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <p style={{ color: "var(--text-muted)", fontWeight: 500 }}>Loading student profile…</p>
    </div>
  );

  if (error) return (
    <div style={{ maxWidth: 480, margin: "60px auto", textAlign: "center" }}>
      <div style={{ fontSize: "3rem", marginBottom: 16 }}>😕</div>
      <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>
      <button className="btn btn-secondary" onClick={() => navigate("/students")}>← Back to Students</button>
    </div>
  );

  if (!data) return null;

  const {
    student, results = [], attendance = [],
    attendanceStats = {}, feePayments = [],
    totalFeePaid = 0, enrollments = [], promotions = [],
  } = data;

  const fullName = `${student.firstName} ${student.lastName}`;
  const initials = `${student.firstName?.[0] || ""}${student.lastName?.[0] || ""}`.toUpperCase();
  const photo    = student.photo ? `${BACKEND}${student.photo}` : null;

  /* ── print profile ── */
  function printProfile() {
    const win = window.open("", "_blank", "width=850,height=900");
    if (!win) return;
    
    const css = `
      body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 32px; margin: 0; line-height: 1.5; }
      h1, h2, h3 { color: #1e1e2f; margin: 0 0 12px; }
      .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 24px; margin-bottom: 32px; }
      .header h1 { font-size: 2.2rem; color: #4f46e5; margin-bottom: 8px; letter-spacing: -0.02em; }
      .subtitle { color: #64748b; font-size: 1.1rem; }
      .grid { display: flex; gap: 40px; margin-bottom: 40px; }
      .col { flex: 1; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 32px; font-size: 0.95rem; }
      th, td { text-align: left; padding: 12px 14px; border-bottom: 1px solid #e2e8f0; }
      th { background: #f8fafc; font-weight: 700; color: #475569; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.05em; }
      .label { font-weight: 700; color: #64748b; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px; }
      .value { font-weight: 600; font-size: 1rem; margin-bottom: 20px; color: #0f172a; }
      .section-title { font-size: 1.25rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 24px; color: #4f46e5; }
      @media print { body { padding: 0; } @page { margin: 1.5cm; } }
    `;
    
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Student Profile - ${fullName}</title><style>${css}</style></head><body>
      <div class="header">
        <h1>${fullName}</h1>
        <div class="subtitle">Official Student Profile Record</div>
        <div style="margin-top: 12px; font-weight: 600; color: #334155; font-size: 1.1rem;">
          EMIS: ${student.emisNumber || "N/A"} &nbsp;|&nbsp; 
          STATUS: <span style="text-transform: capitalize;">${student.status}</span>
        </div>
      </div>
      
      <div class="grid">
        <div class="col">
          <h2 class="section-title">Personal Information</h2>
          <div><span class="label">Date of Birth</span><div class="value">${fmt(student.dateOfBirth)}</div></div>
          <div><span class="label">Gender</span><div class="value">${student.gender || "—"}</div></div>
          <div><span class="label">Admission Date</span><div class="value">${fmt(student.admissionDate)}</div></div>
          <div><span class="label">Phone</span><div class="value">${student.phone || "—"}</div></div>
          <div><span class="label">Address</span><div class="value">${student.address || "—"}</div></div>
        </div>
        
        <div class="col">
          <h2 class="section-title">Academic & Contacts</h2>
          <div><span class="label">Academic Year</span><div class="value">${student.academicYearId?.name || "—"}</div></div>
          <div><span class="label">Class & Section</span><div class="value">${student.classLevelId?.name || "—"}${student.sectionId ? " — " + student.sectionId.name : ""}</div></div>
          <div><span class="label">Portal Email</span><div class="value">${student.studentUserId?.email || "—"}</div></div>
          
          <h2 class="section-title" style="margin-top: 32px;">Guardian Info</h2>
          <div><span class="label">Guardian Name</span><div class="value">${student.guardianName || "—"}</div></div>
          <div><span class="label">Guardian Phone</span><div class="value">${student.guardianPhone || "—"}</div></div>
        </div>
      </div>

      <h2 class="section-title">Academic & Financial Summary</h2>
      <table>
        <thead><tr><th>Metric</th><th>Value</th></tr></thead>
        <tbody>
          <tr><td>Total Exam Results On File</td><td>${results.length} subject entries</td></tr>
          <tr><td>Overall Attendance Rate</td><td>${attendanceStats.percentage != null ? attendanceStats.percentage + "%" : "—"} (${attendanceStats.present || 0} out of ${attendanceStats.total || 0} days)</td></tr>
          <tr><td>Total Fees Paid to Date</td><td>$${totalFeePaid.toLocaleString()}</td></tr>
        </tbody>
      </table>
      
      <div style="text-align: center; margin-top: 64px; color: #94a3b8; font-size: 0.85rem; border-top: 1px dashed #e2e8f0; padding-top: 16px;">
        Generated on ${new Date().toLocaleString()} from official school records.
      </div>
      <script>window.onload = function() { setTimeout(function(){ window.print(); }, 250); }</script>
    </body></html>`;

    win.document.write(html);
    win.document.close();
  }

  return (
    <div className="animate-fade">

      {/* ══════════════════════════════ PAGE HEADER ══ */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 14, marginBottom: 28,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate("/students")}>
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 15 }}>
              <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Students
          </button>
          <div style={{ color: "var(--text-muted)", fontSize: ".85rem" }}>/</div>
          <div style={{ fontWeight: 700, color: "var(--text)", fontSize: ".95rem" }}>{fullName}</div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {editOk && <span className="badge badge-green" style={{ padding: "7px 14px", fontSize: ".8rem" }}>{editOk}</span>}
          <button 
            className="btn btn-secondary btn-sm"
            onClick={printProfile}
            style={{ gap: 6 }}
          >
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 14 }}>
              <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6v-8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Print Profile
          </button>
          <button
            className="btn btn-sm"
            style={{ background: "var(--primary-bg)", color: "var(--primary)", border: "1px solid #a5b4fc" }}
            onClick={editMode ? () => setEditMode(false) : openEdit}
          >
            {editMode ? "✕ Cancel Edit" : "✏️ Edit Student"}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════ HERO CARD ══ */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ padding: "28px 32px" }}>
          <div style={{
            display: "flex", alignItems: "flex-start",
            gap: 28, flexWrap: "wrap",
          }}>
            {/* Avatar */}
            <div style={{ flexShrink: 0 }}>
              {photo
                ? <img src={photo} alt={fullName} style={{ width: 90, height: 90, borderRadius: "50%", objectFit: "cover", border: "4px solid var(--border)" }} />
                : <div style={{
                    width: 90, height: 90, borderRadius: "50%",
                    background: "linear-gradient(135deg,#6366f1,#818cf8)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "2rem", fontWeight: 800, color: "#fff",
                    border: "4px solid #e0e7ff",
                  }}>{initials}</div>
              }
            </div>

            {/* Identity */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-.02em", margin: "0 0 8px" }}>
                {fullName}
              </h1>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 12 }}>
                <span className="badge badge-blue" style={{ fontFamily: "monospace", fontSize: ".75rem" }}>
                  {student.emisNumber ? `EMIS #${student.emisNumber}` : "No EMIS"}
                </span>
                <span className={`badge ${student.status === "active" ? "badge-green" : student.status === "graduated" ? "badge-blue" : "badge-red"}`}
                  style={{ textTransform: "capitalize" }}>
                  {student.status || "active"}
                </span>
                {student.classLevelId && (
                  <span className="badge badge-purple">
                    {student.classLevelId.name}{student.sectionId ? ` — ${student.sectionId.name}` : ""}
                  </span>
                )}
                {student.academicYearId && <span className="badge badge-gray">{student.academicYearId.name}</span>}
              </div>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {student.phone && (
                  <span style={{ fontSize: ".82rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
                    <svg viewBox="0 0 24 24" fill="none" style={{ width: 14 }}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    {student.phone}
                  </span>
                )}
                {student.studentUserId?.email && (
                  <span style={{ fontSize: ".82rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
                    <svg viewBox="0 0 24 24" fill="none" style={{ width: 14 }}><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2"/><path d="m22 6-10 7L2 6" stroke="currentColor" strokeWidth="2"/></svg>
                    {student.studentUserId.email}
                  </span>
                )}
                {student.admissionDate && (
                  <span style={{ fontSize: ".82rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
                    📅 Admitted {fmt(student.admissionDate)}
                  </span>
                )}
              </div>
            </div>

            {/* Quick stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, minWidth: 300 }}>
              <StatCard icon="📝" label="Exam Results" value={results.length} accent="var(--primary)" />
              <StatCard
                icon="✅" label="Attendance"
                value={attendanceStats.percentage != null ? `${attendanceStats.percentage}%` : "—"}
                sub={`${attendanceStats.present || 0}/${attendanceStats.total || 0} sessions`}
                accent={attendanceStats.percentage >= 75 ? "#22c55e" : "#ef4444"}
              />
              <StatCard icon="💳" label="Fees Paid" value={`$${totalFeePaid.toLocaleString()}`} accent="#f59e0b" />
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════ INLINE EDIT PANEL ══ */}
      {editMode && (
        <div className="card animate-fade" style={{ marginBottom: 24, border: "2px solid var(--primary-light)" }}>
          <div className="card-header" style={{ background: "var(--primary-bg)" }}>
            <div className="card-title" style={{ color: "var(--primary)" }}>✏️ Edit Student Details</div>
          </div>
          <form onSubmit={saveEdit}>
            <div className="card-body">
              {editError && <div className="alert alert-error" style={{ marginBottom: 20 }}>{editError}</div>}

              <SectionDivider>Personal Information</SectionDivider>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 8 }}>
                <div className="form-group"><label className="form-label">First Name *</label><input className="form-input" value={editForm.firstName} onChange={e => setEditForm(p => ({ ...p, firstName: e.target.value }))} required /></div>
                <div className="form-group"><label className="form-label">Last Name *</label><input className="form-input" value={editForm.lastName} onChange={e => setEditForm(p => ({ ...p, lastName: e.target.value }))} required /></div>
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
                <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} /></div>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}><label className="form-label">Address</label><input className="form-input" value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} /></div>
              </div>

              <SectionDivider>Guardian & Emergency Contact</SectionDivider>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 8 }}>
                <div className="form-group"><label className="form-label">Guardian Name</label><input className="form-input" value={editForm.guardianName} onChange={e => setEditForm(p => ({ ...p, guardianName: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Guardian Phone</label><input className="form-input" value={editForm.guardianPhone} onChange={e => setEditForm(p => ({ ...p, guardianPhone: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Emergency Contact Name</label><input className="form-input" value={editForm.emergencyContactName} onChange={e => setEditForm(p => ({ ...p, emergencyContactName: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Emergency Contact Phone</label><input className="form-input" value={editForm.emergencyContactPhone} onChange={e => setEditForm(p => ({ ...p, emergencyContactPhone: e.target.value }))} /></div>
              </div>

              <SectionDivider>Class Placement</SectionDivider>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
                <div className="form-group"><label className="form-label">Academic Year</label>
                  <select className="form-select" value={editForm.academicYearId} onChange={e => setEditForm(p => ({ ...p, academicYearId: e.target.value }))}>
                    <option value="">— None —</option>
                    {academicYears.map(y => <option key={y._id} value={y._id}>{y.name}{y.status === "active" ? " (Active)" : ""}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Class</label>
                  <select className="form-select" value={editForm.classLevelId} onChange={e => setEditForm(p => ({ ...p, classLevelId: e.target.value, sectionId: "" }))}>
                    <option value="">— None —</option>
                    {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Section</label>
                  <select className="form-select" value={editForm.sectionId} onChange={e => setEditForm(p => ({ ...p, sectionId: e.target.value }))} disabled={editSections.length === 0}>
                    <option value="">No Section</option>
                    {editSections.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="card-header" style={{ justifyContent: "flex-end", gap: 10, borderTop: "1px solid var(--border-light)", borderBottom: "none" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEditMode(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={editSaving}>
                {editSaving ? "Saving…" : "💾 Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ══════════════════════════════ TAB STRIP ══ */}
      <div style={{
        display: "flex", gap: 0, overflowX: "auto",
        borderBottom: "2px solid var(--border-light)",
        marginBottom: 24,
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "11px 20px", background: "none", border: "none",
            cursor: "pointer", fontSize: ".82rem", fontWeight: 700,
            fontFamily: "inherit", whiteSpace: "nowrap",
            color: tab === t.id ? "var(--primary)" : "var(--text-muted)",
            borderBottom: `2.5px solid ${tab === t.id ? "var(--primary)" : "transparent"}`,
            marginBottom: -2, transition: "all .15s",
          }}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════ TAB: OVERVIEW ══ */}
      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>

          {/* Personal card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">👤 Personal Information</div>
            </div>
            <div className="card-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px" }}>
                <InfoRow label="First Name"     value={student.firstName} />
                <InfoRow label="Last Name"      value={student.lastName} />
                <InfoRow label="Gender"         value={student.gender} />
                <InfoRow label="Date of Birth"  value={fmt(student.dateOfBirth)} />
                <InfoRow label="EMIS Number"    value={student.emisNumber} />
                <InfoRow label="Admission Date" value={fmt(student.admissionDate)} />
                <InfoRow label="Phone"          value={student.phone} />
                <InfoRow label="Status"         value={
                  <span className={`badge ${student.status === "active" ? "badge-green" : student.status === "graduated" ? "badge-blue" : "badge-red"}`} style={{ textTransform: "capitalize" }}>
                    {student.status}
                  </span>
                } />
              </div>
              <div style={{ marginTop: 14 }}>
                <InfoRow label="Home Address" value={student.address} />
              </div>
            </div>
          </div>

          {/* Right stack */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Academic placement */}
            <div className="card">
              <div className="card-header"><div className="card-title">🏫 Academic Placement</div></div>
              <div className="card-body">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px" }}>
                  <InfoRow label="Academic Year" value={student.academicYearId?.name} />
                  <InfoRow label="Class / Grade"  value={student.classLevelId?.name} />
                  <InfoRow label="Section"        value={student.sectionId?.name} />
                  <InfoRow label="Portal Email"   value={student.studentUserId?.email} />
                </div>
              </div>
            </div>

            {/* Guardian */}
            <div className="card">
              <div className="card-header"><div className="card-title">🛡️ Guardian & Emergency Contact</div></div>
              <div className="card-body">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px" }}>
                  <InfoRow label="Guardian Name"  value={student.guardianName} />
                  <InfoRow label="Guardian Phone" value={student.guardianPhone} />
                </div>
                <SectionDivider>Emergency</SectionDivider>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px" }}>
                  <InfoRow label="Contact Name"  value={student.emergencyContactName} />
                  <InfoRow label="Contact Phone" value={student.emergencyContactPhone} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════ TAB: RESULTS ══ */}
      {tab === "results" && (
        <div>
          {Object.keys(resultsByTerm).length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="2"/></svg>
              <h3>No results yet</h3>
              <p>Results will appear here once a teacher enters marks for this student.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {Object.values(resultsByTerm).map(({ term, items }) => {
                const allTermItems = results.filter(r => (r.examTermId?._id || "uk") === (term?._id || "uk"));
                const avg = allTermItems.length > 0
                  ? Math.round(allTermItems.reduce((s, r) => s + (r.marksObtained / r.maxMarks) * 100, 0) / allTermItems.length)
                  : 0;
                const avgColor = avg >= 70 ? "#22c55e" : avg >= 50 ? "#f59e0b" : "#ef4444";

                return (
                  <div className="card" key={term?._id || "uk"}>
                    <div className="card-header">
                      <div>
                        <div className="card-title">{term?.name || "Unknown Exam"}</div>
                        <div className="card-subtitle">{term?.academicYearId?.name || ""}</div>
                      </div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "1.2rem", fontWeight: 800, color: avgColor }}>{avg}%</div>
                          <div style={{ fontSize: ".68rem", color: "var(--text-muted)" }}>average</div>
                        </div>
                        <span className={`badge ${term?.status === "completed" ? "badge-green" : term?.status === "ongoing" ? "badge-blue" : "badge-gray"}`}
                          style={{ textTransform: "capitalize" }}>
                          {term?.status || "—"}
                        </span>
                      </div>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Subject</th>
                              <th>Code</th>
                              <th>Score</th>
                              <th>Percentage</th>
                              <th>Grade</th>
                              <th>Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map(r => {
                              const pct = Math.round((r.marksObtained / r.maxMarks) * 100);
                              const pctColor = pct >= 60 ? "#22c55e" : "#ef4444";
                              return (
                                <tr key={r._id}>
                                  <td style={{ fontWeight: 600 }}>{r.subjectId?.name || "—"}</td>
                                  <td className="td-muted" style={{ fontFamily: "monospace" }}>{r.subjectId?.code || "—"}</td>
                                  <td className="td-muted">{r.marksObtained} / {r.maxMarks}</td>
                                  <td>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                      <div style={{ width: 70, height: 6, borderRadius: 3, background: "var(--border-light)", overflow: "hidden" }}>
                                        <div style={{ width: `${pct}%`, height: "100%", background: pctColor, borderRadius: 3, transition: "width .4s" }} />
                                      </div>
                                      <span style={{ fontSize: ".8rem", fontWeight: 700, color: pctColor }}>{pct}%</span>
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
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════ TAB: ATTENDANCE ══ */}
      {tab === "attendance" && (
        <div>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 14, marginBottom: 24 }}>
            <StatCard icon="📊" label="Total Sessions" value={attendanceStats.total || 0} accent="var(--primary)" />
            <StatCard icon="✅" label="Present" value={attendanceStats.present || 0} accent="#22c55e" />
            <StatCard icon="⏰" label="Late" value={attendanceStats.late || 0} accent="#f59e0b" />
            <StatCard icon="🔕" label="Excused" value={attendanceStats.excused || 0} accent="#94a3b8" />
            <StatCard icon="❌" label="Absent" value={attendanceStats.absent || 0} accent="#ef4444" />
            <StatCard
              icon="📈" label="Attendance Rate"
              value={attendanceStats.percentage != null ? `${attendanceStats.percentage}%` : "—"}
              accent={attendanceStats.percentage >= 75 ? "#22c55e" : "#ef4444"}
            />
          </div>

          {/* Attendance bar */}
          {attendanceStats.total > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-body">
                <div style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: 10 }}>Attendance Breakdown</div>
                <div style={{ display: "flex", height: 14, borderRadius: 999, overflow: "hidden", gap: 2 }}>
                  {[
                    { key: "present", color: "#22c55e" },
                    { key: "late",    color: "#f59e0b" },
                    { key: "excused", color: "#94a3b8" },
                    { key: "absent",  color: "#ef4444" },
                  ].map(({ key, color }) => {
                    const val = attendanceStats[key] || 0;
                    const pct = attendanceStats.total > 0 ? (val / attendanceStats.total) * 100 : 0;
                    return pct > 0 ? (
                      <div key={key} style={{ flex: pct, background: color, borderRadius: 999, transition: "flex .4s" }} title={`${key}: ${val}`} />
                    ) : null;
                  })}
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                  {[["Present","#22c55e"], ["Late","#f59e0b"], ["Excused","#94a3b8"], ["Absent","#ef4444"]].map(([lbl, clr]) => (
                    <span key={lbl} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: ".72rem", color: "var(--text-muted)" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: clr, display: "inline-block" }} />
                      {lbl}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          {attendance.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4M2 12a10 10 0 1 0 20 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
              <h3>No attendance records</h3>
              <p>Attendance records will appear here once they are marked.</p>
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
                      <tr><th>Date</th><th>Period</th><th>Class</th><th>Section</th><th>Status</th><th>Note</th></tr>
                    </thead>
                    <tbody>
                      {attendance.slice(0, 80).map((a, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{fmt(a.date)}</td>
                          <td className="td-muted">{a.period || "—"}</td>
                          <td className="td-muted">{a.classLevel?.name || "—"}</td>
                          <td className="td-muted">{a.section?.name || "—"}</td>
                          <td><span className={`badge ${attColor(a.status)}`} style={{ textTransform: "capitalize" }}>{a.status}</span></td>
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

      {/* ══════════════════════════════════════════ TAB: FEES ══ */}
      {tab === "fees" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
            <StatCard icon="💳" label="Total Payments" value={feePayments.length} accent="var(--primary)" />
            <StatCard icon="💰" label="Total Amount Paid" value={`$${totalFeePaid.toLocaleString()}`} accent="#22c55e" />
          </div>

          {feePayments.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm-1 14v-2H9v-2h2v-1H9V9h2V7h2v2h2v2h-3v1h3v2h-2v2h-2Z"/></svg>
              <h3>No payment records</h3>
              <p>Fee payment records will appear here once added.</p>
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Payment History</div>
                <div className="card-subtitle">{feePayments.length} payment{feePayments.length !== 1 ? "s" : ""}</div>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Fee Name</th><th>Total Fee</th><th>Amount Paid</th><th>Balance</th><th>Method</th><th>Date</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {feePayments.map(p => {
                        const balance = (p.feeStructureId?.amount != null && p.amountPaid != null)
                          ? p.feeStructureId.amount - p.amountPaid : null;
                        return (
                          <tr key={p._id}>
                            <td style={{ fontWeight: 600 }}>{p.feeStructureId?.name || "—"}</td>
                            <td className="td-muted">${p.feeStructureId?.amount?.toLocaleString() || "—"}</td>
                            <td style={{ color: "#22c55e", fontWeight: 700 }}>${p.amountPaid?.toLocaleString()}</td>
                            <td style={{ color: balance > 0 ? "#ef4444" : "#22c55e", fontWeight: 600 }}>
                              {balance != null ? `$${balance.toLocaleString()}` : "—"}
                            </td>
                            <td className="td-muted" style={{ textTransform: "capitalize" }}>{p.method?.replace("_", " ") || "—"}</td>
                            <td className="td-muted">{fmt(p.paymentDate)}</td>
                            <td>
                              <span className={`badge ${p.status === "paid" ? "badge-green" : p.status === "partial" ? "badge-blue" : "badge-red"}`}
                                style={{ textTransform: "capitalize" }}>{p.status}</span>
                            </td>
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
      )}

      {/* ══════════════════════════════════════════ TAB: HISTORY ══ */}
      {tab === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Enrollments */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">📋 Enrollment History</div>
                <div className="card-subtitle">{enrollments.length} record{enrollments.length !== 1 ? "s" : ""}</div>
              </div>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {enrollments.length === 0 ? (
                <div className="empty-state" style={{ padding: 40 }}><h3>No enrollment records</h3></div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Academic Year</th><th>Class</th><th>Section</th><th>Roll No.</th><th>Status</th><th>Enrolled On</th></tr>
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

          {/* Promotions */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">🎓 Promotion / Transfer Log</div>
                <div className="card-subtitle">{promotions.length} record{promotions.length !== 1 ? "s" : ""}</div>
              </div>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {promotions.length === 0 ? (
                <div className="empty-state" style={{ padding: 40 }}><h3>No promotions yet</h3></div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Action</th><th>From Year</th><th>To Year</th><th>From Class</th><th>To Class</th><th>Reason</th><th>Date</th></tr>
                    </thead>
                    <tbody>
                      {promotions.map(p => (
                        <tr key={p._id}>
                          <td>
                            <span className={`badge ${p.action === "promoted" ? "badge-green" : p.action === "graduated" ? "badge-blue" : p.action === "transferred" ? "badge-cyan" : "badge-gray"}`}
                              style={{ textTransform: "capitalize" }}>
                              {p.action}
                            </span>
                          </td>
                          <td className="td-muted">{p.fromAcademicYearId?.name || "—"}</td>
                          <td className="td-muted">{p.toAcademicYearId?.name || "—"}</td>
                          <td className="td-muted">
                            {p.fromClassLevelId?.name || "—"}
                            {p.fromSectionId ? <span style={{ fontSize: "0.75rem", color: "var(--text-light)", display: "block" }}>Sec: {p.fromSectionId.name}</span> : null}
                          </td>
                          <td className="td-muted">
                            {p.toClassLevelId?.name || "—"}
                            {p.toSectionId ? <span style={{ fontSize: "0.75rem", color: "var(--text-light)", display: "block" }}>Sec: {p.toSectionId.name}</span> : null}
                          </td>
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

    </div>
  );
}
