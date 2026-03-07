import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../../lib/api";

function Field({ label, value }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: ".68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--text-muted)", marginBottom: 3 }}>{label}</div>
      <div style={{ fontWeight: 600, color: "var(--text)", fontSize: ".9rem" }}>
        {value || <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>—</span>}
      </div>
    </div>
  );
}

function Modal({ visible, onClose, title, children }) {
  if (!visible) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-scale">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 16 }}><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function fmt(d) {
  if (!d) return null;
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return null; }
}

export default function StudentProfilePage() {
  const { profileData, loading, reload } = useOutletContext();
  const [showEdit, setShowEdit] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [pwdForm, setPwdForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>;
  if (!profileData) return null;

  const { student, user } = profileData;
  const fullName = `${student.firstName} ${student.lastName}`;
  const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();

  function openEdit() {
    setEditForm({ phone: student.phone || "", address: student.address || "", guardianName: student.guardianName || "", guardianPhone: student.guardianPhone || "" });
    setEditError(""); setEditSuccess(""); setShowEdit(true);
  }

  async function saveProfile(e) {
    e.preventDefault(); setEditError(""); setEditSuccess(""); setSaving(true);
    try {
      await api.put("/api/students/me", editForm);
      await reload();
      setEditSuccess("Profile updated!");
      setTimeout(() => { setShowEdit(false); setEditSuccess(""); }, 1200);
    } catch (err) {
      setEditError(err?.response?.data?.message || "Failed to update");
    } finally { setSaving(false); }
  }

  async function changePassword(e) {
    e.preventDefault(); setPwdError(""); setPwdSuccess("");
    if (pwdForm.newPassword !== pwdForm.confirm) { setPwdError("Passwords don't match"); return; }
    if (pwdForm.newPassword.length < 6) { setPwdError("Minimum 6 characters"); return; }
    setSaving(true);
    try {
      await api.put("/api/students/me", { currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword });
      setPwdSuccess("Password changed!");
      setPwdForm({ currentPassword: "", newPassword: "", confirm: "" });
      setTimeout(() => { setShowPwd(false); setPwdSuccess(""); }, 1400);
    } catch (err) {
      setPwdError(err?.response?.data?.message || "Failed");
    } finally { setSaving(false); }
  }

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1>My Profile</h1>
          <p>View and update your personal information.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => setShowPwd(true)}>🔒 Change Password</button>
          <button className="btn btn-primary" onClick={openEdit}>✏️ Edit Info</button>
        </div>
      </div>

      {/* Identity Hero */}
      <div className="card" style={{ marginBottom: 20, background: "linear-gradient(135deg,rgba(99,102,241,.06),rgba(129,140,248,.03))" }}>
        <div className="card-body" style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#818cf8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", fontWeight: 800, color: "#fff", flexShrink: 0, boxShadow: "0 8px 24px rgba(99,102,241,.35)" }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text)" }}>{fullName}</div>
            <div style={{ color: "var(--text-muted)", fontSize: ".82rem", marginTop: 2 }}>{user?.email}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <span className="badge badge-blue" style={{ fontFamily: "monospace" }}>{student.emisNumber ? `EMIS #${student.emisNumber}` : "No EMIS"}</span>
              <span className={`badge ${student.status === "active" ? "badge-green" : "badge-gray"}`} style={{ textTransform: "capitalize" }}>{student.status}</span>
              {student.classLevelId && <span className="badge badge-gray">{student.classLevelId.name}{student.sectionId ? ` — ${student.sectionId.name}` : ""}</span>}
              {student.academicYearId && <span className="badge badge-gray">{student.academicYearId.name}</span>}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
        <div className="card">
          <div className="card-header"><div className="card-title">Personal Details</div></div>
          <div className="card-body">
            <Field label="First Name" value={student.firstName} />
            <Field label="Last Name" value={student.lastName} />
            <Field label="Gender" value={student.gender} />
            <Field label="Date of Birth" value={fmt(student.dateOfBirth)} />
            <Field label="Admission Date" value={fmt(student.admissionDate)} />
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
            <div className="card-header"><div className="card-title">Guardian &amp; Emergency</div></div>
            <div className="card-body">
              <Field label="Guardian Name" value={student.guardianName} />
              <Field label="Guardian Phone" value={student.guardianPhone} />
              <Field label="Emergency Contact" value={student.emergencyContactName} />
              <Field label="Emergency Phone" value={student.emergencyContactPhone} />
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal visible={showEdit} onClose={() => setShowEdit(false)} title="Edit Profile">
        <form onSubmit={saveProfile}>
          <div className="modal-body">
            {editError && <div className="alert alert-error" style={{ marginBottom: 12 }}>{editError}</div>}
            {editSuccess && <div className="alert alert-success" style={{ marginBottom: 12 }}>{editSuccess}</div>}
            <div className="alert alert-info" style={{ marginBottom: 14, fontSize: ".8rem" }}>Academic details can only be changed by an administrator.</div>
            <div className="form-grid form-grid-2" style={{ gap: 14 }}>
              <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={editForm.phone || ""} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} placeholder="+1234567890" /></div>
              <div className="form-group"><label className="form-label">Guardian Name</label><input className="form-input" value={editForm.guardianName || ""} onChange={e => setEditForm(p => ({ ...p, guardianName: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Guardian Phone</label><input className="form-input" value={editForm.guardianPhone || ""} onChange={e => setEditForm(p => ({ ...p, guardianPhone: e.target.value }))} /></div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}><label className="form-label">Address</label><input className="form-input" value={editForm.address || ""} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} /></div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
          </div>
        </form>
      </Modal>

      {/* Password Modal */}
      <Modal visible={showPwd} onClose={() => setShowPwd(false)} title="Change Password">
        <form onSubmit={changePassword}>
          <div className="modal-body">
            {pwdError && <div className="alert alert-error" style={{ marginBottom: 12 }}>{pwdError}</div>}
            {pwdSuccess && <div className="alert alert-success" style={{ marginBottom: 12 }}>{pwdSuccess}</div>}
            <div className="form-grid" style={{ gap: 14 }}>
              <div className="form-group"><label className="form-label">Current Password</label><input type="password" className="form-input" value={pwdForm.currentPassword} onChange={e => setPwdForm(p => ({ ...p, currentPassword: e.target.value }))} required /></div>
              <div className="form-group"><label className="form-label">New Password</label><input type="password" className="form-input" value={pwdForm.newPassword} onChange={e => setPwdForm(p => ({ ...p, newPassword: e.target.value }))} required /></div>
              <div className="form-group"><label className="form-label">Confirm Password</label><input type="password" className="form-input" value={pwdForm.confirm} onChange={e => setPwdForm(p => ({ ...p, confirm: e.target.value }))} required /></div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowPwd(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Changing..." : "Change Password"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
