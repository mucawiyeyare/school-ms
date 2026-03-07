import { useEffect, useState } from "react";
import { api } from "../lib/api";

const ROLES = ["Admin", "Teacher", "Student", "Parent"];
const ROLE_BADGE = { Admin: "role-admin", Teacher: "role-teacher", Student: "role-student", Parent: "role-parent" };
const STATUS_BADGE = { active: "badge-green", inactive: "badge-red" };

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

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "Teacher", phone: "" });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  async function load() {
    try {
      setLoading(true);
      const { data } = await api.get("/api/auth/users");
      setUsers(data);
    } catch (e) { setError(e?.response?.data?.message || "Failed to load users"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchQ = u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchQ && matchRole;
  });

  function openCreate() { setEditUser(null); setForm({ name: "", email: "", password: "", role: "Teacher", phone: "" }); setShowModal(true); }
  function openEdit(u) { setEditUser(u); setForm({ name: u.name, email: u.email, password: "", role: u.role, phone: u.phone || "" }); setShowModal(true); }

  async function save() {
    setSaving(true); setError("");
    try {
      if (editUser) {
        const payload = { name: form.name, email: form.email, role: form.role, phone: form.phone };
        await api.patch(`/api/auth/users/${editUser._id}`, payload);
      } else {
        await api.post("/api/auth/register", form);
      }
      setShowModal(false); load();
    } catch (e) { setError(e?.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  }

  async function confirmDelete() {
    try { await api.delete(`/api/auth/users/${deleteId}`); setDeleteId(null); load(); }
    catch (e) { setError(e?.response?.data?.message || "Delete failed"); }
  }

  async function toggleStatus(u) {
    await api.patch(`/api/auth/users/${u._id}`, { status: u.status === "active" ? "inactive" : "active" });
    load();
  }

  return (
    <div>
      <div className="page-header">
        <h1>User Management</h1>
        <p>Create and manage staff, teachers, students, and parent accounts.</p>
      </div>
      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">All Users</div>
            <div className="card-subtitle">{filtered.length} user{filtered.length !== 1 ? "s" : ""} found</div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <div className="search-wrap" style={{ width: 200 }}>
              <svg className="search-icon" viewBox="0 0 24 24" fill="none"><path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="form-select" style={{ width: 140 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="">All Roles</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button className="btn btn-primary btn-sm" onClick={openCreate}>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 5v14M5 12h14"/></svg>
              New User
            </button>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Status</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6}><div className="empty-state">
                    <svg viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="2"/></svg>
                    <h3>No users found</h3><p>Create a user to get started.</p>
                  </div></td></tr>
                ) : filtered.map(u => (
                  <tr key={u._id}>
                    <td><div style={{ fontWeight: 600 }}>{u.name}</div></td>
                    <td className="td-muted">{u.email}</td>
                    <td><span className={`badge ${ROLE_BADGE[u.role] || "badge-gray"}`}>{u.role}</span></td>
                    <td className="td-muted">{u.phone || "—"}</td>
                    <td><span className={`badge ${STATUS_BADGE[u.status] || "badge-gray"}`}>{u.status}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>Edit</button>
                        <button className="btn btn-sm" style={{ background: u.status === "active" ? "var(--warning-bg)" : "var(--success-bg)", color: u.status === "active" ? "#92400e" : "var(--success)", border: "none" }} onClick={() => toggleStatus(u)}>
                          {u.status === "active" ? "Deactivate" : "Activate"}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(u._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal visible={showModal} onClose={() => setShowModal(false)} title={editUser ? "Edit User" : "Create New User"}>
        <div className="modal-body">
          <div className="form-grid form-grid-2" style={{ gap: 14 }}>
            <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" /></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@school.com" /></div>
            {!editUser && <div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••" /></div>}
            <div className="form-group"><label className="form-label">Role</label>
              <select className="form-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 234 567 890" /></div>
          </div>
          {error && <div className="alert alert-error" style={{ marginTop: 12 }}>{error}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Saving..." : editUser ? "Update User" : "Create User"}</button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal visible={!!deleteId} onClose={() => setDeleteId(null)} title="Delete User">
        <div className="modal-body"><p style={{ color: "var(--text-muted)" }}>Are you sure? This action cannot be undone.</p></div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}
