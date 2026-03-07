import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { auth } from "../lib/auth";

function Avatar({ name = "", size = 100 }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #60a5fa, #2563eb)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.4,
        fontWeight: 800,
        color: "#fff",
        flexShrink: 0,
        boxShadow: "0 8px 24px rgba(37,99,235,0.35)",
        letterSpacing: "0.02em",
      }}
    >
      {initials || "?"}
    </div>
  );
}

function InfoRow({ label, value, icon }) {
  if (!value) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "16px 20px",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        marginBottom: 12,
        background: "var(--surface)",
        transition: "all 0.2s",
      }}
      onMouseOver={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.borderColor = "var(--primary-light)"; }}
      onMouseOut={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "var(--border)"; }}
    >
      <span
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: "var(--primary-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--primary)",
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 2, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {label}
        </div>
        <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text)" }}>{value}</div>
      </div>
    </div>
  );
}

const RoleBadgeColors = {
  Admin: { bg: "var(--purple-bg)", color: "var(--purple)", border: "rgba(139,92,246,0.2)" },
  Teacher: { bg: "var(--primary-bg)", color: "var(--primary)", border: "rgba(37,99,235,0.2)" },
  Student: { bg: "var(--success-bg)", color: "var(--success)", border: "rgba(16,185,129,0.2)" },
  Parent: { bg: "var(--warning-bg)", color: "#92400e", border: "rgba(245,158,11,0.2)" },
};

export default function MyProfile() {
  const [user, setUser] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    setLoading(true);
    setFetchError("");
    api
      .get("/api/auth/me")
      .then((res) => {
        setUser(res.data);
      })
      .catch((err) => {
        console.error("Failed to fetch profile:", err);
        const cached = auth.getUser();
        if (cached) {
          setUser(cached);
        } else {
          setFetchError(
            err?.response?.data?.message ||
              "Unable to load profile. Please refresh the page."
          );
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await api.put("/api/auth/me/password", { currentPassword, newPassword });
      setSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update password.");
    } finally {
      setSaving(false);
    }
  }

  const roleStyle = RoleBadgeColors[user?.role] || RoleBadgeColors["Admin"];

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16, color: "var(--text-muted)" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "var(--primary)", animation: "spin 0.8s linear infinite" }} />
        <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>Loading profile…</span>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "56px 24px", maxWidth: 500, margin: "40px auto" }}>
        <svg viewBox="0 0 24 24" fill="none" style={{ width: 56, height: 56, margin: "0 auto 20px", color: "var(--danger)" }}>
          <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <p style={{ color: "var(--danger)", marginBottom: 24, fontSize: "1.05rem", fontWeight: 600 }}>{fetchError}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()} style={{ minWidth: 140 }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade" style={{ display: "grid", gap: 32, maxWidth: 720, margin: "0 auto", paddingBottom: 40 }}>
      {/* Centered Profile Card */}
      <div className="card" style={{ overflow: "hidden", textAlign: "center", paddingBottom: 32 }}>
        {/* Cover Photo */}
        <div style={{ height: 160, background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)", position: "relative" }}>
          <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.08)", filter: "blur(20px)" }} />
          <div style={{ position: "absolute", bottom: -50, left: 10, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,0.05)", filter: "blur(15px)" }} />
        </div>
        
        {/* Avatar overlapping cover */}
        <div style={{ marginTop: -55, display: "flex", justifyContent: "center", position: "relative", zIndex: 10 }}>
          <div style={{ padding: 6, background: "var(--surface)", borderRadius: "50%", display: "inline-block" }}>
            <Avatar name={user?.name} size={110} />
          </div>
        </div>

        <h2 style={{ margin: "16px 0 8px", fontSize: "1.8rem", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em" }}>
          {user?.name || "—"}
        </h2>
        
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <span style={{ fontSize: "0.8rem", fontWeight: 700, padding: "5px 14px", borderRadius: 999, background: roleStyle.bg, color: roleStyle.color, border: `1px solid ${roleStyle.border}`, letterSpacing: "0.02em" }}>
            {user?.role}
          </span>
          <span style={{ fontSize: "0.8rem", fontWeight: 700, padding: "5px 14px", borderRadius: 999, background: "var(--success-bg)", color: "var(--success)", border: "1px solid rgba(16,185,129,0.2)", letterSpacing: "0.02em" }}>
            Active
          </span>
        </div>

        <div style={{ padding: "0 40px", textAlign: "left" }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid var(--border-light)" }}>Profile Details</h3>
          
          <InfoRow label="Email Address" value={user?.email} icon={<svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20 }}><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 2-8 5-8-5h16Zm0 12H4V9l8 5 8-5v9Z" /></svg>} />
          <InfoRow label="Phone" value={user?.phone || "Not provided"} icon={<svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20 }}><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8Z" /></svg>} />
          <InfoRow label="Account ID" value={user?._id} icon={<svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20 }}><path d="M17 9V7a5 5 0 0 0-10 0v2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-5 6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3-6H9V7a3 3 0 1 1 6 0v2Z" /></svg>} />
        </div>
      </div>

      {/* Change Password Card */}
      <div className="card">
        <div className="card-header" style={{ padding: "24px 32px" }}>
          <div>
            <h2 className="card-title" style={{ fontSize: "1.2rem" }}>Security</h2>
            <p className="card-subtitle">Update your account password. Must be at least 6 characters.</p>
          </div>
        </div>

        <div className="card-body" style={{ padding: "32px" }}>
          {error && (
            <div className="alert alert-error" style={{ marginBottom: 24, padding: "14px 20px" }}>
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18, flexShrink: 0 }}><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm1 15h-2v-2h2v2Zm0-4h-2V7h2v6Z" /></svg>
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success" style={{ marginBottom: 24, padding: "14px 20px" }}>
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18, flexShrink: 0 }}><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm-2 14.5-4-4 1.41-1.41L10 13.67l6.59-6.58L18 8.5l-8 8Z" /></svg>
              {success}
            </div>
          )}

          <form onSubmit={handlePasswordChange} style={{ display: "grid", gap: 20 }}>
            {[
              { label: "Current Password", val: currentPassword, set: setCurrentPassword, show: showCurrent, setShow: setShowCurrent },
              { label: "New Password", val: newPassword, set: setNewPassword, show: showNew, setShow: setShowNew },
              { label: "Confirm New Password", val: confirmPassword, set: setConfirmPassword, show: showNew, setShow: setShowNew },
            ].map(({ label, val, set, show, setShow }, i) => (
              <div key={i} className="form-group">
                <label className="form-label">{label}</label>
                <div style={{ position: "relative" }}>
                  <input
                    className="form-input"
                    type={show ? "text" : "password"}
                    value={val}
                    onChange={(e) => set(e.target.value)}
                    required
                    style={{ paddingRight: 48, padding: "12px 16px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    style={{
                      position: "absolute",
                      right: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      padding: 4,
                      display: "flex",
                      alignItems: "center",
                      borderRadius: "var(--radius-sm)",
                    }}
                    tabIndex={-1}
                    onMouseOver={(e) => e.currentTarget.style.color = "var(--primary)"}
                    onMouseOut={(e) => e.currentTarget.style.color = "var(--text-muted)"}
                  >
                    {show ? (
                      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20 }}>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" style={{ width: 20, height: 20 }}>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" stroke="currentColor" strokeWidth="2" />
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}

            <div style={{ paddingTop: 12, borderTop: "1px solid var(--border-light)", marginTop: 8 }}>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={saving}
                style={{ width: "100%", padding: "14px", fontSize: "1rem" }}
              >
                {saving ? (
                  <>
                    <svg style={{ width: 20, animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none"><path d="M12 3a9 9 0 1 0 9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                    Updating Password...
                  </>
                ) : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
