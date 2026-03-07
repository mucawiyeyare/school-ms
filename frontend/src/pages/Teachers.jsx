import { useEffect, useState } from "react";
import { api } from "../lib/api";

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

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals state
  const [registerModal, setRegisterModal] = useState(false);
  const [editTeacher, setEditTeacher] = useState(null);
  const [assignTeacher, setAssignTeacher] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Forms state
  const [regForm, setRegForm] = useState({ name: "", email: "", password: "", phone: "", status: "active" });
  const [editForm, setEditForm] = useState({ name: "", phone: "", status: "", password: "" });
  const [selectedSubjects, setSelectedSubjects] = useState([]); // array of subject IDs

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true); setError("");
    try {
      const [tRes, sRes] = await Promise.all([
        api.get("/api/teachers"),
        api.get("/api/subjects")
      ]);
      setTeachers(tRes.data);
      setSubjects(sRes.data);
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  // --- Register ---
  async function handleRegister(e) {
    e.preventDefault();
    setSaving(true); setFormError("");
    try {
      await api.post("/api/teachers", regForm);
      setRegisterModal(false);
      setRegForm({ name: "", email: "", password: "", phone: "", status: "active" });
      loadData();
    } catch (err) {
      setFormError(err?.response?.data?.message || "Registration failed");
    } finally { setSaving(false); }
  }

  // --- Edit ---
  function openEdit(t) {
    setEditForm({ name: t.name, phone: t.phone || "", status: t.status, password: "" });
    setEditTeacher(t);
  }
  async function handleEdit(e) {
    e.preventDefault();
    setSaving(true); setFormError("");
    try {
      await api.put(`/api/teachers/${editTeacher._id}`, editForm);
      setEditTeacher(null);
      loadData();
    } catch (err) {
      setFormError(err?.response?.data?.message || "Edit failed");
    } finally { setSaving(false); }
  }

  // --- Assign Subjects ---
  function openAssign(t) {
    setSelectedSubjects(t.subjects ? t.subjects.map(s => s._id) : []);
    setAssignTeacher(t);
  }
  function toggleSubject(sid) {
    setSelectedSubjects(prev =>
      prev.includes(sid) ? prev.filter(id => id !== sid) : [...prev, sid]
    );
  }
  async function handleAssign(e) {
    e.preventDefault();
    setSaving(true); setFormError("");
    try {
      await api.post(`/api/teachers/${assignTeacher._id}/assign`, { subjectIds: selectedSubjects });
      setAssignTeacher(null);
      loadData();
    } catch (err) {
      setFormError(err?.response?.data?.message || "Assignment failed");
    } finally { setSaving(false); }
  }

  // --- Delete ---
  async function handleDelete() {
    setSaving(true); setFormError("");
    try {
      await api.delete(`/api/teachers/${deleteId}`);
      setDeleteId(null);
      loadData();
    } catch (err) {
      setFormError(err?.response?.data?.message || "Delete failed");
    } finally { setSaving(false); }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Teachers</h1>
        <p>Manage teaching staff, register new teachers, and assign subjects.</p>
        <button className="btn btn-primary" onClick={() => setRegisterModal(true)} style={{ marginTop: 12 }}>
          + Register Teacher
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>Loading teachers…</div>
          ) : teachers.length === 0 ? (
            <div className="empty-state"><h3>No teachers found</h3></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Teacher</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Assigned Subjects</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map(t => (
                    <tr key={t._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{t.name}</div>
                        <div className="td-muted" style={{ fontSize: ".75rem" }}>{t.email}</div>
                      </td>
                      <td className="td-muted">{t.phone || "—"}</td>
                      <td>
                        <span className={`badge ${t.status === "active" ? "badge-green" : "badge-gray"}`} style={{ textTransform: "capitalize" }}>
                          {t.status}
                        </span>
                      </td>
                      <td>
                        {t.subjects && t.subjects.length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {t.subjects.map(s => (
                              <span key={s._id} className="badge badge-blue" style={{ fontSize: ".7rem" }}>
                                {s.name} {s.classLevelId?.name ? `(${s.classLevelId.name})` : ""}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="td-muted">—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn btn-sm btn-secondary" onClick={() => openAssign(t)}>Assign</button>
                          <button className="btn btn-sm btn-secondary" onClick={() => openEdit(t)}>Edit</button>
                          <button className="btn btn-sm btn-danger" onClick={() => setDeleteId(t._id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* --- Register Modal --- */}
      <Modal visible={registerModal} onClose={() => setRegisterModal(false)} title="Register Teacher">
        <form onSubmit={handleRegister}>
          <div className="modal-body">
            {formError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{formError}</div>}
            <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" required value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Email (Login) *</label><input type="email" className="form-input" required value={regForm.email} onChange={e => setRegForm({...regForm, email: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Password *</label><input type="password" className="form-input" minLength={6} required value={regForm.password} onChange={e => setRegForm({...regForm, password: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={regForm.phone} onChange={e => setRegForm({...regForm, phone: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Status</label>
              <select className="form-select" value={regForm.status} onChange={e => setRegForm({...regForm, status: e.target.value})}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setRegisterModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Register"}</button>
          </div>
        </form>
      </Modal>

      {/* --- Edit Modal --- */}
      <Modal visible={!!editTeacher} onClose={() => setEditTeacher(null)} title="Edit Teacher">
        <form onSubmit={handleEdit}>
          <div className="modal-body">
            {formError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{formError}</div>}
            <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" required value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">New Password (leave blank to keep current)</label><input type="password" className="form-input" minLength={6} value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Status</label>
              <select className="form-select" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setEditTeacher(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
          </div>
        </form>
      </Modal>

      {/* --- Assign Subjects Modal --- */}
      <Modal visible={!!assignTeacher} onClose={() => setAssignTeacher(null)} title={`Assign Subjects: ${assignTeacher?.name}`}>
        <form onSubmit={handleAssign}>
          <div className="modal-body" style={{ maxHeight: "60vh", overflowY: "auto" }}>
            {formError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{formError}</div>}
            
            <p style={{ fontSize: ".85rem", color: "var(--text-muted)", marginBottom: 16 }}>
              Select the subjects this teacher is responsible for. This updates the teacher assigned to the subject.
            </p>

            {subjects.length === 0 ? (
              <div className="empty-state" style={{ padding: 16 }}><p>No subjects exist yet.</p></div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {subjects.map(s => {
                  const isChecked = selectedSubjects.includes(s._id);
                  // Optionally detect if someone else teaches this
                  const otherTeacher = s.teacherUserId && s.teacherUserId._id !== assignTeacher?._id;
                  
                  return (
                    <label key={s._id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", background: isChecked ? "var(--primary-bg)" : "var(--surface)" }}>
                      <input type="checkbox" checked={isChecked} onChange={() => toggleSubject(s._id)} style={{ width: 16, height: 16 }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: ".9rem" }}>{s.name} <span style={{ fontFamily: "monospace", color: "var(--text-muted)", fontSize: ".8rem" }}>({s.code})</span></div>
                        <div style={{ fontSize: ".75rem", color: "var(--text-muted)" }}>
                          Class: {s.classLevelId?.name || "All"}
                          {otherTeacher && !isChecked ? ` • Currently assigned to ${s.teacherUserId.name}` : ""}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setAssignTeacher(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Save Assignments"}</button>
          </div>
        </form>
      </Modal>

      {/* --- Delete Confirmation --- */}
      <Modal visible={!!deleteId} onClose={() => setDeleteId(null)} title="Confirm Deletion">
        <div className="modal-body">
          {formError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{formError}</div>}
          <p>Are you sure you want to delete this teacher? They will be removed from all assigned subjects.</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>{saving ? "Deleting…" : "Yes, Delete"}</button>
        </div>
      </Modal>
    </div>
  );
}
