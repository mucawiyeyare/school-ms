import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { auth } from "../lib/auth";

function Modal({ visible, onClose, title, size, children }) {
  if (!visible) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal animate-scale ${size || ""}`}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}><svg viewBox="0 0 24 24" fill="none" style={{width:16}}><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const EMPTY_CLASS = { name: "", orderNumber: "" };
const EMPTY_SECTION = { classLevelId: "", name: "" };

function fmtDate(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "—"; }
}

export default function ClassesSections() {
  const user = auth.getUser();
  const isAdmin = user?.role === "Admin";
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]); // All available subjects
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  // Class modal state
  const [showClassModal, setShowClassModal] = useState(false);
  const [editClass, setEditClass] = useState(null);
  const [classForm, setClassForm] = useState(EMPTY_CLASS);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]); // selected checkboxes
  const [subjectSearch, setSubjectSearch] = useState("");

  // Per-class cached subjects map { classId: [subjectObj, ...] }
  const [classSubjectsMap, setClassSubjectsMap] = useState({});

  // Section modal state
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editSection, setEditSection] = useState(null);
  const [sectionForm, setSectionForm] = useState(EMPTY_SECTION);

  // View students modal
  const [viewClass, setViewClass] = useState(null);
  const [classStudents, setClassStudents] = useState([]);
  const [classStudentsLoading, setClassStudentsLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [printMode, setPrintMode] = useState("full"); // "name" | "emis" | "name_emis" | "full"

  // View subjects modal
  const [viewSubjectsClass, setViewSubjectsClass] = useState(null);
  const [viewSubjectsList, setViewSubjectsList] = useState([]);
  const [viewSubjectsLoading, setViewSubjectsLoading] = useState(false);

  async function load() {
    setError("");
    setLoading(true);
    try {
      const [cRes, sRes, subRes] = await Promise.all([
        api.get("/api/classes"),
        api.get("/api/sections"),
        api.get("/api/subjects"),
      ]);
      setClasses(cRes.data);
      setSections(sRes.data);
      setAllSubjects(subRes.data || []);

      if (cRes.data?.[0]?._id) {
        setSectionForm((p) => ({ ...p, classLevelId: p.classLevelId || cRes.data[0]._id }));
      }

      // Pre-fetch subjects for each class so they show in the table
      if (cRes.data?.length > 0) {
        const entries = await Promise.all(
          cRes.data.map(async (cls) => {
            try {
              const { data } = await api.get(`/api/classes/${cls._id}/subjects`);
              return [cls._id, data || []];
            } catch {
              return [cls._id, []];
            }
          })
        );
        setClassSubjectsMap(Object.fromEntries(entries));
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load classes/sections");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // ── Subject checkbox helpers ──
  function toggleSubject(id) {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  // Filtered subject list inside modal
  const filteredModalSubjects = useMemo(() => {
    if (!subjectSearch.trim()) return allSubjects;
    const q = subjectSearch.toLowerCase();
    return allSubjects.filter(
      (s) => s.name?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q)
    );
  }, [allSubjects, subjectSearch]);

  // ── Class handlers ──
  function openCreateClass() {
    setEditClass(null);
    setClassForm(EMPTY_CLASS);
    setSelectedSubjectIds([]);
    setSubjectSearch("");
    setError("");
    setShowClassModal(true);
  }

  async function openEditClass(cls) {
    setEditClass(cls);
    setClassForm({ name: cls.name, orderNumber: String(cls.orderNumber) });
    setSubjectSearch("");
    setError("");
    // Load existing subjects for this class
    try {
      const { data } = await api.get(`/api/classes/${cls._id}/subjects`);
      setSelectedSubjectIds((data || []).map((s) => s._id));
    } catch {
      setSelectedSubjectIds([]);
    }
    setShowClassModal(true);
  }

  function closeClassModal() {
    setShowClassModal(false);
    setEditClass(null);
    setClassForm(EMPTY_CLASS);
    setSelectedSubjectIds([]);
    setSubjectSearch("");
    setError("");
  }

  async function submitClass(e) {
    e.preventDefault(); setError("");
    const name = classForm.name.trim();
    const orderNumber = Number(classForm.orderNumber);
    if (!name || !Number.isFinite(orderNumber)) { setError("Class name and order number are required"); return; }
    try {
      if (editClass) {
        await api.put(`/api/classes/${editClass._id}`, { name, orderNumber });
        // Update subject assignments separately for more robust handling
        await api.post(`/api/classes/${editClass._id}/subjects`, { subjectIds: selectedSubjectIds });
      } else {
        const { data: newClass } = await api.post("/api/classes", { name, orderNumber });
        // Assign selected subjects to the newly created class
        if (selectedSubjectIds.length > 0) {
          await api.post(`/api/classes/${newClass._id}/subjects`, { subjectIds: selectedSubjectIds });
        }
      }
      closeClassModal(); await load();
    } catch (err) { setError(err?.response?.data?.message || `Failed to ${editClass ? "update" : "create"} class`); }
  }

  async function deleteClass(id, name) {
    if (!window.confirm(`Delete class "${name}" and all its sections? This cannot be undone.`)) return;
    setError(""); setBusyId(id);
    try { await api.delete(`/api/classes/${id}`); await load(); }
    catch (err) { setError(err?.response?.data?.message || "Failed to delete class"); }
    finally { setBusyId(null); }
  }

  // ── Section handlers ──
  function openCreateSection() { setEditSection(null); setSectionForm({ classLevelId: classes[0]?._id || "", name: "" }); setError(""); setShowSectionModal(true); }
  function openEditSection(section) { setEditSection(section); setSectionForm({ classLevelId: section.classLevelId?._id || section.classLevelId, name: section.name }); setError(""); setShowSectionModal(true); }
  function closeSectionModal() { setShowSectionModal(false); setEditSection(null); setSectionForm(EMPTY_SECTION); setError(""); }

  async function submitSection(e) {
    e.preventDefault(); setError("");
    const { classLevelId, name } = sectionForm;
    if (!classLevelId || !name.trim()) { setError("Section name and class are required"); return; }
    try {
      if (editSection) await api.put(`/api/sections/${editSection._id}`, { classLevelId, name: name.trim() });
      else await api.post("/api/sections", { classLevelId, name: name.trim() });
      closeSectionModal(); await load();
    } catch (err) { setError(err?.response?.data?.message || `Failed to ${editSection ? "update" : "create"} section`); }
  }

  async function deleteSection(id, name) {
    if (!window.confirm(`Delete section "${name}"? This cannot be undone.`)) return;
    setError(""); setBusyId(id);
    try { await api.delete(`/api/sections/${id}`); await load(); }
    catch (err) { setError(err?.response?.data?.message || "Failed to delete section"); }
    finally { setBusyId(null); }
  }

  // ── View students ──
  async function openViewClass(cls) {
    setViewClass(cls);
    setStudentSearch("");
    setClassStudents([]);
    setClassStudentsLoading(true);
    try {
      const { data } = await api.get("/api/students", { params: { classLevelId: cls._id, limit: 1000 } });
      setClassStudents(data.items || []);
    } catch { setClassStudents([]); }
    finally { setClassStudentsLoading(false); }
  }

  // ── View subjects ──
  async function openViewSubjects(cls) {
    setViewSubjectsClass(cls);
    setViewSubjectsList([]);
    setViewSubjectsLoading(true);
    try {
      const { data } = await api.get(`/api/classes/${cls._id}/subjects`);
      setViewSubjectsList(data || []);
    } catch { setViewSubjectsList([]); }
    finally { setViewSubjectsLoading(false); }
  }

  function printClassStudents() {
    const cls = viewClass;
    const list = filteredClassStudents;

    let thead = "";
    let rows = "";
    if (printMode === "name") {
      thead = "<tr><th>#</th><th>Student Name</th></tr>";
      rows = list.map((s, i) => "<tr><td>" + (i+1) + "</td><td>" + s.firstName + " " + s.lastName + "</td></tr>").join("");
    } else if (printMode === "emis") {
      thead = "<tr><th>#</th><th>EMIS Number</th></tr>";
      rows = list.map((s, i) => "<tr><td>" + (i+1) + "</td><td>" + (s.emisNumber || "—") + "</td></tr>").join("");
    } else if (printMode === "name_emis") {
      thead = "<tr><th>#</th><th>EMIS No</th><th>Student Name</th></tr>";
      rows = list.map((s, i) => "<tr><td>" + (i+1) + "</td><td>" + (s.emisNumber || "—") + "</td><td>" + s.firstName + " " + s.lastName + "</td></tr>").join("");
    } else {
      thead = "<tr><th>#</th><th>EMIS No</th><th>Name</th><th>Gender</th><th>Section</th><th>Status</th><th>Email</th></tr>";
      rows = list.map((s, i) =>
        "<tr><td>" + (i+1) + "</td><td>" + (s.emisNumber||"—") + "</td><td>" +
        s.firstName + " " + s.lastName + "</td><td>" +
        (s.gender||"—") + "</td><td>" +
        (s.sectionId?.name||"—") + "</td><td>" +
        (s.status||"active") + "</td><td>" +
        (s.studentUserId?.email||"—") + "</td></tr>"
      ).join("");
    }

    const modeLabel = { name: "Names Only", emis: "EMIS Numbers Only", name_emis: "Name & EMIS No", full: "Full Details" }[printMode];

    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    const html = "<!DOCTYPE html><html><head><meta charset='utf-8'><title>" + cls.name + " Students</title>" +
      "<style>body{font-family:'Segoe UI',Arial,sans-serif;margin:24px;}h2{color:#4f46e5;margin-bottom:4px;}" +
      ".meta{color:#64748b;font-size:.82rem;margin-bottom:16px;}" +
      "table{width:100%;border-collapse:collapse;}th,td{padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:.85rem;text-align:left;}" +
      "th{background:#f8fafc;font-weight:700;}@media print{body{margin:0;}}</style>" +
      "</head><body>" +
      "<h2>" + cls.name + " — Student List</h2>" +
      "<div class='meta'>Print mode: " + modeLabel + " &nbsp;|&nbsp; Total: " + list.length + " students &nbsp;|&nbsp; " + new Date().toLocaleString() + "</div>" +
      "<table><thead>" + thead + "</thead><tbody>" + rows + "</tbody></table>" +
      "<script>window.onload=function(){window.print();}<\/script></body></html>";
    win.document.write(html);
    win.document.close();
  }

  const filteredClassStudents = useMemo(() => {
    if (!studentSearch) return classStudents;
    const q = studentSearch.toLowerCase();
    return classStudents.filter(s =>
      (s.firstName + " " + s.lastName).toLowerCase().includes(q) ||
      (s.emisNumber || "").toLowerCase().includes(q) ||
      (s.studentUserId?.email || "").toLowerCase().includes(q)
    );
  }, [classStudents, studentSearch]);

  const groupedSections = useMemo(() => {
    const g = new Map();
    for (const s of sections) {
      const classId = s.classLevelId?._id || s.classLevelId;
      if (!g.has(classId)) g.set(classId, []);
      g.get(classId).push(s);
    }
    for (const [k, arr] of g.entries()) {
      arr.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      g.set(k, arr);
    }
    return g;
  }, [sections]);

  return (
    <div>
      <div className="page-header">
        <h1>Classes &amp; Sections</h1>
        <p>Define grade levels, assign subjects, and manage structural sections (e.g. A, B, C).</p>
        {error && <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>}
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">All Classes</div>
            <div className="card-subtitle">{classes.length} distinct grade levels</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {isAdmin && <button className="btn btn-secondary btn-sm" onClick={openCreateSection}>+ New Section</button>}
            {isAdmin && <button className="btn btn-primary btn-sm" onClick={openCreateClass}>+ New Class</button>}
          </div>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
          ) : classes.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 7.5 12 3l9 4.5-9 4.5-9-4.5Zm2 4.75 7 3.5v5L5 17.25v-5Zm14 0v5l-7 3.5v-5l7-3.5Z"/></svg>
              <h3>No classes found</h3><p>Create a class level to structure your school.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Class / Grade Level</th>
                    <th>Order</th>
                    <th>Assigned Subjects</th>
                    <th>Sections</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((c) => {
                    const secs = groupedSections.get(c._id) || [];
                    const assignedSubjects = classSubjectsMap[c._id] || [];
                    return (
                      <tr key={c._id}>
                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                        <td className="td-muted">Level {c.orderNumber}</td>
                        <td>
                          {assignedSubjects.length === 0 ? (
                            <span className="td-muted italic" style={{ fontSize: ".78rem" }}>No subjects</span>
                          ) : (
                            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                              {assignedSubjects.slice(0, 4).map((s) => (
                                <span key={s._id} className="badge badge-blue" style={{ fontSize: ".7rem" }}>
                                  {s.code}
                                </span>
                              ))}
                              {assignedSubjects.length > 4 && (
                                <span
                                  className="badge badge-gray"
                                  style={{ fontSize: ".7rem", cursor: "pointer" }}
                                  onClick={() => openViewSubjects(c)}
                                  title="Click to see all subjects"
                                >
                                  +{assignedSubjects.length - 4} more
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          {secs.length === 0 ? (
                            <span className="td-muted italic">No sections</span>
                          ) : (
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                              {secs.map(s => (
                                <span key={s._id} className="badge badge-gray" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                  {s.name}
                                  {isAdmin && <button title="Edit section" onClick={() => openEditSection(s)} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 2px", lineHeight: 1, color: "inherit" }}>✏️</button>}
                                  {isAdmin && <button title="Delete section" disabled={busyId === s._id} onClick={() => deleteSection(s._id, s.name)} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 2px", lineHeight: 1, color: "inherit" }}>🗑️</button>}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => openViewClass(c)} title="View students">
                              👁️ Students
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => openViewSubjects(c)} title="View subjects">
                              📚 Subjects
                            </button>
                            {isAdmin && <button className="btn btn-secondary btn-sm" onClick={() => openEditClass(c)} title="Edit class">
                              ✏️ Edit
                            </button>}
                            {isAdmin && <button className="btn btn-danger btn-sm" disabled={busyId === c._id} onClick={() => deleteClass(c._id, c.name)} title="Delete class">
                              🗑️ Delete
                            </button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── View Students Modal ── */}
      <Modal visible={!!viewClass} onClose={() => setViewClass(null)} title={viewClass ? `${viewClass.name} — Students` : ""} size="modal-lg">
        <div className="modal-body" style={{ padding: "16px 20px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div className="td-muted" style={{ fontSize: ".82rem" }}>
              {classStudentsLoading ? "Loading..." : `${filteredClassStudents.length} student${filteredClassStudents.length !== 1 ? "s" : ""} found`}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div className="search-wrap" style={{ minWidth: 180 }}>
                <svg className="search-icon" viewBox="0 0 24 24" fill="none"><path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Name, EMIS no, email..." />
              </div>
              <select
                className="form-select"
                style={{ fontSize: ".78rem", padding: "5px 8px", minWidth: 160 }}
                value={printMode}
                onChange={e => setPrintMode(e.target.value)}
                title="Choose what to print"
              >
                <option value="name">🖨️ Print: Names Only</option>
                <option value="emis">🖨️ Print: EMIS Numbers Only</option>
                <option value="name_emis">🖨️ Print: Name &amp; EMIS No</option>
                <option value="full">🖨️ Print: Full Details</option>
              </select>
              <button className="btn btn-primary btn-sm" onClick={printClassStudents}>
                🖨️ Print
              </button>
            </div>
          </div>

          {classStudentsLoading ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>Loading students...</div>
          ) : filteredClassStudents.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>
              <svg viewBox="0 0 24 24" fill="none"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z" stroke="currentColor" strokeWidth="2"/></svg>
              <h3 style={{ fontSize: "1rem" }}>{studentSearch ? "No students match your search" : "No students in this class"}</h3>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>EMIS No</th>
                    <th>Name</th>
                    <th>Gender</th>
                    <th>Section</th>
                    <th>Status</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClassStudents.map((s, i) => (
                    <tr key={s._id}>
                      <td className="td-muted">{i + 1}</td>
                      <td><span className="badge badge-blue" style={{ fontFamily: "monospace" }}>{s.emisNumber || "—"}</span></td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#eef2ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".72rem", fontWeight: 700, flexShrink: 0 }}>
                            {s.firstName[0]}{s.lastName[0]}
                          </div>
                          <span style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</span>
                        </div>
                      </td>
                      <td className="td-muted" style={{ textTransform: "capitalize" }}>{s.gender || "—"}</td>
                      <td className="td-muted">{s.sectionId?.name || "—"}</td>
                      <td>
                        <span className={`badge ${s.status === "active" ? "badge-green" : "badge-gray"}`} style={{ textTransform: "capitalize" }}>
                          {s.status || "active"}
                        </span>
                      </td>
                      <td className="td-muted" style={{ fontSize: ".78rem" }}>{s.studentUserId?.email || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setViewClass(null)}>Close</button>
        </div>
      </Modal>

      {/* ── View Subjects Modal ── */}
      <Modal visible={!!viewSubjectsClass} onClose={() => setViewSubjectsClass(null)} title={viewSubjectsClass ? `${viewSubjectsClass.name} — Assigned Subjects` : ""} size="modal-md">
        <div className="modal-body">
          {viewSubjectsLoading ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>Loading subjects...</div>
          ) : viewSubjectsList.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>
              <svg viewBox="0 0 24 24" fill="none"><path d="M12 2 2 7v10l10 5 10-5V7L12 2Z" stroke="currentColor" strokeWidth="2"/></svg>
              <h3 style={{ fontSize: "1rem" }}>No subjects assigned</h3>
              <p style={{ fontSize: ".85rem" }}>Edit this class to assign subjects.</p>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: ".82rem", color: "var(--text-muted)", marginBottom: 14 }}>
                {viewSubjectsList.length} subject{viewSubjectsList.length !== 1 ? "s" : ""} assigned to <strong>{viewSubjectsClass?.name}</strong>
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {viewSubjectsList.map((s) => (
                  <div key={s._id} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                    background: "var(--bg-secondary, #f8fafc)", borderRadius: 8,
                    border: "1px solid var(--border-color, #e2e8f0)"
                  }}>
                    <span className="badge badge-blue" style={{ fontFamily: "monospace", minWidth: 72, textAlign: "center" }}>{s.code}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: ".9rem" }}>{s.name}</div>
                      {s.description && <div className="td-muted" style={{ fontSize: ".75rem" }}>{s.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setViewSubjectsClass(null)}>Close</button>
          {isAdmin && <button className="btn btn-primary" onClick={() => { setViewSubjectsClass(null); openEditClass(viewSubjectsClass); }}>
            ✏️ Edit Subjects
          </button>}
        </div>
      </Modal>

      {/* ── Class Create/Edit Modal ── */}
      <Modal visible={showClassModal} onClose={closeClassModal} title={editClass ? "Edit Class" : "Create Class Level"} size="modal-md">
        <form onSubmit={submitClass}>
          <div className="modal-body">
            {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
            <div className="form-grid" style={{ gap: 14, marginBottom: 20 }}>
              <div className="form-group">
                <label className="form-label">Class Name</label>
                <input name="name" value={classForm.name} onChange={e => setClassForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Grade 4" className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Order Number</label>
                <input name="orderNumber" value={classForm.orderNumber} onChange={e => setClassForm(p => ({ ...p, orderNumber: e.target.value }))} type="number" placeholder="e.g. 4" className="form-input" min="0" />
                <p style={{ fontSize: ".7rem", color: "var(--text-light)", marginTop: 4 }}>Used to determine subsequent grade for promotions.</p>
              </div>
            </div>

            {/* ── Subject Selection ── */}
            <div className="form-group">
              <label className="form-label" style={{ marginBottom: 8 }}>
                Assign Subjects
                {selectedSubjectIds.length > 0 && (
                  <span className="badge badge-blue" style={{ marginLeft: 8, fontSize: ".7rem" }}>
                    {selectedSubjectIds.length} selected
                  </span>
                )}
              </label>

              {allSubjects.length === 0 ? (
                <div style={{ padding: "14px 16px", background: "var(--bg-secondary, #f8fafc)", borderRadius: 8, fontSize: ".83rem", color: "var(--text-muted)", border: "1px solid var(--border-color, #e2e8f0)" }}>
                  No subjects available. Create subjects first from the Subjects page.
                </div>
              ) : (
                <div style={{ border: "1px solid var(--border-color, #e2e8f0)", borderRadius: 10, overflow: "hidden" }}>
                  {/* Search inside subject list */}
                  <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border-color, #e2e8f0)", background: "var(--bg-secondary, #f8fafc)", display: "flex", alignItems: "center", gap: 8 }}>
                    <svg viewBox="0 0 24 24" fill="none" style={{ width: 14, color: "var(--text-muted)", flexShrink: 0 }}>
                      <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <input
                      value={subjectSearch}
                      onChange={e => setSubjectSearch(e.target.value)}
                      placeholder="Filter subjects..."
                      style={{ border: "none", outline: "none", background: "transparent", fontSize: ".82rem", width: "100%", color: "inherit" }}
                    />
                    {selectedSubjectIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedSubjectIds([])}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: ".72rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {/* Checkbox list */}
                  <div style={{ maxHeight: 220, overflowY: "auto", padding: "6px 0" }}>
                    {filteredModalSubjects.length === 0 ? (
                      <div style={{ padding: "16px", textAlign: "center", fontSize: ".82rem", color: "var(--text-muted)" }}>
                        No subjects match your filter
                      </div>
                    ) : (
                      filteredModalSubjects.map((subject) => {
                        const checked = selectedSubjectIds.includes(subject._id);
                        return (
                          <label
                            key={subject._id}
                            style={{
                              display: "flex", alignItems: "center", gap: 10,
                              padding: "8px 14px", cursor: "pointer",
                              background: checked ? "var(--primary-light, #eef2ff)" : "transparent",
                              transition: "background 0.15s",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSubject(subject._id)}
                              style={{ width: 15, height: 15, accentColor: "#4f46e5", flexShrink: 0, cursor: "pointer" }}
                            />
                            <span className="badge badge-blue" style={{ fontFamily: "monospace", fontSize: ".68rem", minWidth: 60, textAlign: "center" }}>
                              {subject.code}
                            </span>
                            <span style={{ fontSize: ".85rem", fontWeight: checked ? 600 : 400 }}>{subject.name}</span>
                            {subject.description && (
                              <span style={{ fontSize: ".72rem", color: "var(--text-muted)", marginLeft: "auto" }}>
                                {subject.description}
                              </span>
                            )}
                          </label>
                        );
                      })
                    )}
                  </div>

                  {/* Footer summary */}
                  <div style={{ padding: "8px 14px", borderTop: "1px solid var(--border-color, #e2e8f0)", background: "var(--bg-secondary, #f8fafc)", fontSize: ".75rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
                    <span>{filteredModalSubjects.length} subject{filteredModalSubjects.length !== 1 ? "s" : ""} available</span>
                    <span style={{ color: selectedSubjectIds.length > 0 ? "#4f46e5" : "inherit", fontWeight: selectedSubjectIds.length > 0 ? 600 : 400 }}>
                      {selectedSubjectIds.length} selected
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeClassModal}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editClass ? "Save Changes" : "Create Class"}</button>
          </div>
        </form>
      </Modal>

      {/* ── Section Create/Edit Modal ── */}
      <Modal visible={showSectionModal} onClose={closeSectionModal} title={editSection ? "Edit Section" : "Create Section"} size="modal-sm">
        <form onSubmit={submitSection}>
          <div className="modal-body">
            {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
            <div className="form-grid" style={{ gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Class</label>
                <select name="classLevelId" value={sectionForm.classLevelId} onChange={e => setSectionForm(p => ({ ...p, classLevelId: e.target.value }))} className="form-select">
                  {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Section Name</label>
                <input name="name" value={sectionForm.name} onChange={e => setSectionForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. A" className="form-input" />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeSectionModal}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editSection ? "Save Changes" : "Create Section"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}