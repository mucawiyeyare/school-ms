import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { auth } from "../lib/auth";

function Modal({ visible, onClose, title, children }) {
  if (!visible) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-scale">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}><svg viewBox="0 0 24 24" fill="none" style={{width:16}}><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Subjects() {
  const user = auth.getUser();
  const isAdmin = user?.role === "Admin";
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", code: "", classLevelId: "", teacherUserId: "", academicYearId: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  async function load() {
    try {
      setLoading(true);
      const [sRes, cRes, uRes, yRes] = await Promise.all([
        api.get("/api/subjects"),
        api.get("/api/classes"),
        api.get("/api/auth/users?role=Teacher"),
        api.get("/api/academic-years"),
      ]);
      setSubjects(sRes.data || []);
      setClasses(cRes.data || []);
      setTeachers(uRes.data || []);
      setYears(yRes.data || []);
    } catch (e) { setError(e?.response?.data?.message || "Failed to load"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const activeYear = years.find(y => y.status === "active");
  const filtered = subjects.filter(s => {
    const q = search.toLowerCase();
    const matchQ = s.name?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q);
    const matchC = !classFilter || String(s.classLevelId?._id || s.classLevelId) === classFilter;
    return matchQ && matchC;
  });

  function openCreate() {
    setEditId(null);
    setForm({ name: "", code: "", classLevelId: classes[0]?._id || "", teacherUserId: "", academicYearId: activeYear?._id || "", description: "" });
    setShowModal(true);
  }
  function openEdit(s) {
    setEditId(s._id);
    setForm({ name: s.name, code: s.code, classLevelId: s.classLevelId?._id || s.classLevelId, teacherUserId: s.teacherUserId?._id || s.teacherUserId || "", academicYearId: s.academicYearId?._id || s.academicYearId || "", description: s.description || "" });
    setShowModal(true);
  }

  async function save() {
    setSaving(true); setError("");
    try {
      const payload = { ...form, teacherUserId: form.teacherUserId || undefined, academicYearId: form.academicYearId || undefined };
      if (editId) await api.put(`/api/subjects/${editId}`, payload);
      else await api.post("/api/subjects", payload);
      setShowModal(false); load();
    } catch (e) { setError(e?.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  }

  async function confirmDelete() {
    try { await api.delete(`/api/subjects/${deleteId}`); setDeleteId(null); load(); }
    catch (e) { setError(e?.response?.data?.message || "Delete failed"); }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Subjects</h1>
        <p>Manage subjects by class level and assign them to teachers.</p>
      </div>
      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">All Subjects</div>
            <div className="card-subtitle">{filtered.length} subject{filtered.length !== 1 ? "s" : ""}</div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <div className="search-wrap" style={{ width: 180 }}>
              <svg className="search-icon" viewBox="0 0 24 24" fill="none"><path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="form-select" style={{ width: 160 }} value={classFilter} onChange={e => setClassFilter(e.target.value)}>
              <option value="">All Classes</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            {isAdmin && <button className="btn btn-primary btn-sm" onClick={openCreate}>
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 15 }}><path d="M12 5v14M5 12h14"/></svg>
              New Subject
            </button>}
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Code</th><th>Subject</th><th>Class</th><th>Teacher</th><th>Academic Year</th>{isAdmin && <th>Actions</th>}</tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={isAdmin ? 6 : 5} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={isAdmin ? 6 : 5}><div className="empty-state">
                    <svg viewBox="0 0 24 24" fill="none"><path d="M12 2 2 7v10l10 5 10-5V7L12 2Z" stroke="currentColor" strokeWidth="2"/></svg>
                    <h3>No subjects yet</h3><p>Create a subject to assign to classes.</p>
                  </div></td></tr>
                ) : filtered.map(s => (
                  <tr key={s._id}>
                    <td><span className="badge badge-blue">{s.code}</span></td>
                    <td><div style={{ fontWeight: 600 }}>{s.name}</div><div className="td-muted" style={{ fontSize: ".75rem" }}>{s.description}</div></td>
                    <td className="td-muted">{s.classLevelId?.name || "—"}</td>
                    <td className="td-muted">{s.teacherUserId?.name || <span style={{ color: "var(--text-light)", fontStyle: "italic" }}>Unassigned</span>}</td>
                    <td className="td-muted">{s.academicYearId?.name || "—"}</td>
                    {isAdmin && <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(s._id)}>Delete</button>
                      </div>
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal visible={showModal} onClose={() => setShowModal(false)} title={editId ? "Edit Subject" : "Create Subject"}>
        <div className="modal-body">
          <div className="form-grid form-grid-2" style={{ gap: 14 }}>
            <div className="form-group"><label className="form-label">Subject Name</label><input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Mathematics" /></div>
            <div className="form-group"><label className="form-label">Code</label><input className="form-input" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="MATH101" /></div>
            <div className="form-group"><label className="form-label">Default Class <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span></label>
              <select className="form-select" value={form.classLevelId} onChange={e => setForm(f => ({ ...f, classLevelId: e.target.value }))}>
                <option value="">None (assign via Classes page)</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <p style={{ fontSize: ".7rem", color: "var(--text-light)", marginTop: 4 }}>Subjects can be assigned to multiple classes via the Classes &amp; Sections page.</p>
            </div>
            <div className="form-group"><label className="form-label">Teacher (optional)</label>
              <select className="form-select" value={form.teacherUserId} onChange={e => setForm(f => ({ ...f, teacherUserId: e.target.value }))}>
                <option value="">None</option>
                {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Academic Year</label>
              <select className="form-select" value={form.academicYearId} onChange={e => setForm(f => ({ ...f, academicYearId: e.target.value }))}>
                <option value="">None</option>
                {years.map(y => <option key={y._id} value={y._id}>{y.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: "1/-1" }}><label className="form-label">Description (optional)</label><input className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief subject description" /></div>
          </div>
          {error && <div className="alert alert-error" style={{ marginTop: 12 }}>{error}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Saving..." : editId ? "Update" : "Create"}</button>
        </div>
      </Modal>

      <Modal visible={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Subject">
        <div className="modal-body"><p style={{ color: "var(--text-muted)" }}>Are you sure you want to delete this subject?</p></div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}
