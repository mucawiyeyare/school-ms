import { useEffect, useState } from "react";
import { api } from "../lib/api";

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

const PRIORITY = { normal: "priority-normal", high: "priority-high", urgent: "priority-urgent" };
const PRIORITY_LABELS = ["normal", "high", "urgent"];

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", priority: "normal", targetRoles: ["All"] });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  async function load() {
    try { setLoading(true); const { data } = await api.get("/api/announcements"); setAnnouncements(data); }
    catch (e) { setError(e?.response?.data?.message || "Failed to load"); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function save() {
    setSaving(true); setError("");
    try {
      await api.post("/api/announcements", form);
      setShowModal(false); setForm({ title: "", content: "", priority: "normal", targetRoles: ["All"] }); load();
    } catch (e) { setError(e?.response?.data?.message || "Failed to post"); }
    finally { setSaving(false); }
  }

  async function confirmDelete() {
    try { await api.delete(`/api/announcements/${deleteId}`); setDeleteId(null); load(); }
    catch (e) { setError(e?.response?.data?.message || "Delete failed"); }
  }

  function formatDate(d) {
    return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div>
      <div className="page-header">
        <h1>Announcements</h1>
        <p>Post notices and announcements visible to specific roles or the entire school.</p>
      </div>
      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="card">
        <div className="card-header">
          <div className="card-title">All Announcements</div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 15 }}><path d="M12 5v14M5 12h14"/></svg>
            New Announcement
          </button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
          ) : announcements.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none"><path d="M3 8v8h2l4 4h2V4H9L5 8H3Zm14-2a7 7 0 0 1 0 12" stroke="currentColor" strokeWidth="2"/></svg>
              <h3>No announcements</h3><p>Post your first announcement above.</p>
            </div>
          ) : announcements.map(a => (
            <div key={a._id} style={{ padding: "18px 24px", borderBottom: "1px solid var(--border-light)", display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: ".95rem", color: "var(--text)" }}>{a.title}</span>
                  <span className={`badge ${PRIORITY[a.priority] || "badge-gray"}`}>{a.priority}</span>
                  {a.targetRoles?.map(r => <span key={r} className="badge badge-gray">{r}</span>)}
                </div>
                <p style={{ margin: "6px 0 8px", fontSize: ".85rem", color: "var(--text-muted)", lineHeight: 1.6 }}>{a.content}</p>
                <div style={{ fontSize: ".75rem", color: "var(--text-light)" }}>By <strong>{a.postedBy?.name}</strong> · {formatDate(a.publishedAt)}</div>
              </div>
              <button className="btn btn-danger btn-sm" style={{ flexShrink: 0 }} onClick={() => setDeleteId(a._id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>

      <Modal visible={showModal} onClose={() => setShowModal(false)} title="New Announcement">
        <div className="modal-body">
          <div className="form-grid" style={{ gap: 14 }}>
            <div className="form-group"><label className="form-label">Title</label><input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Announcement title" /></div>
            <div className="form-group"><label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {PRIORITY_LABELS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Content</label>
              <textarea className="form-textarea" rows={4} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your announcement here..." style={{ resize: "vertical" }} />
            </div>
          </div>
          {error && <div className="alert alert-error" style={{ marginTop: 12 }}>{error}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Posting..." : "Post Announcement"}</button>
        </div>
      </Modal>

      <Modal visible={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Announcement">
        <div className="modal-body"><p style={{ color: "var(--text-muted)" }}>Are you sure you want to delete this announcement?</p></div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}
