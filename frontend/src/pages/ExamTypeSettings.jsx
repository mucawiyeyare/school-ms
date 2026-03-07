import { useState, useEffect } from "react";
import { api } from "../lib/api";

const EXAM_TYPE_COLORS = {
  monthly1: { bg: "#ede9fe", color: "#6d28d9", border: "#c4b5fd", icon: "📝" },
  midterm:  { bg: "#dbeafe", color: "#1d4ed8", border: "#93c5fd", icon: "📖" },
  monthly2: { bg: "#fef9c3", color: "#854d0e", border: "#fde047", icon: "✏️" },
  final:    { bg: "#dcfce7", color: "#15803d", border: "#86efac", icon: "🎓" },
};

export default function ExamTypeSettings() {
  const [examTypes, setExamTypes] = useState([]);
  const [editing, setEditing]     = useState(null); // { code, label, maxMarks, isEnabled }
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");

  useEffect(() => {
    api.get("/api/marks/exam-types")
      .then(r => setExamTypes(r.data || []))
      .catch(() => setError("Failed to load exam types"));
  }, []);

  function startEdit(et) {
    setEditing({ ...et });
    setError("");
    setSuccess("");
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      const res = await api.put(`/api/marks/exam-types/${editing.code}`, {
        label:     editing.label,
        maxMarks:  Number(editing.maxMarks),
        isEnabled: editing.isEnabled
      });
      setExamTypes(prev => prev.map(e => e.code === editing.code ? res.data : e));
      setSuccess(`"${editing.label}" updated successfully.`);
      setEditing(null);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const totalMarks = examTypes.reduce((s, e) => e.isEnabled ? s + (e.maxMarks || 0) : s, 0);

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 0 40px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>Exam Type Settings</h1>
        <p style={{ color: "var(--text-2,#6b7280)", fontSize: ".9rem", margin: "4px 0 0" }}>
          Manage the 4 fixed exam types. Admin can rename labels, adjust max marks, or disable an exam type.
        </p>
      </div>

      {/* Total marks indicator */}
      <div className="card" style={{
        padding: "16px 20px", borderRadius: 14, marginBottom: 24,
        display: "flex", alignItems: "center", gap: 16,
        borderLeft: `4px solid ${totalMarks === 100 ? "#10b981" : "#f59e0b"}`
      }}>
        <div style={{ fontSize: "2rem" }}>📊</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: "1.2rem", color: totalMarks === 100 ? "#10b981" : "#f59e0b" }}>
            Total: {totalMarks} / 100 marks
          </div>
          <div style={{ fontSize: ".82rem", color: "#6b7280" }}>
            {totalMarks === 100 ? "✅ Perfect — totals sum to 100." : "⚠️ Warning — totals should sum to 100 for correct calculations."}
          </div>
        </div>
      </div>

      {success && (
        <div style={{ padding: "12px 16px", borderRadius: 10, marginBottom: 16, background: "#d1fae5", color: "#065f46", fontWeight: 600 }}>
          ✅ {success}
        </div>
      )}
      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 10, marginBottom: 16, background: "#fef2f2", color: "#dc2626", fontWeight: 600 }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: "grid", gap: 14 }}>
        {examTypes.map((et, idx) => {
          const c = EXAM_TYPE_COLORS[et.code] || { bg: "#f3f4f6", color: "#374151", border: "#e5e7eb", icon: "📋" };
          const isEditing = editing?.code === et.code;

          return (
            <div key={et.code} className="card" style={{
              padding: 20, borderRadius: 14,
              border: `2px solid ${isEditing ? "#6366f1" : (et.isEnabled ? c.border : "#e5e7eb")}`,
              opacity: et.isEnabled ? 1 : .6,
              transition: "all .2s"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: isEditing ? 16 : 0 }}>
                {/* Order badge */}
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", background: c.bg, border: `2px solid ${c.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700,
                  fontSize: ".8rem", color: c.color, flexShrink: 0
                }}>{idx + 1}</div>

                <div style={{ fontSize: "1.5rem" }}>{c.icon}</div>

                <div style={{ flex: 1 }}>
                  {!isEditing ? (
                    <>
                      <div style={{ fontWeight: 700, fontSize: "1rem" }}>{et.label}</div>
                      <div style={{ fontSize: ".78rem", color: "#9ca3af" }}>Code: {et.code} · Max: {et.maxMarks} marks</div>
                    </>
                  ) : null}
                </div>

                {!isEditing && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
                      borderRadius: 6, padding: "3px 12px", fontSize: ".78rem", fontWeight: 700
                    }}>
                      {et.maxMarks} marks
                    </div>
                    <div style={{
                      background: et.isEnabled ? "#d1fae5" : "#fef2f2",
                      color: et.isEnabled ? "#065f46" : "#dc2626",
                      borderRadius: 6, padding: "3px 10px", fontSize: ".75rem", fontWeight: 700
                    }}>
                      {et.isEnabled ? "Enabled" : "Disabled"}
                    </div>
                    <button
                      onClick={() => startEdit(et)}
                      style={{
                        padding: "7px 14px", borderRadius: 8, border: "1.5px solid #e5e7eb",
                        background: "none", cursor: "pointer", fontWeight: 600, fontSize: ".8rem",
                        transition: "all .15s"
                      }}
                    >
                      ✏️ Edit
                    </button>
                  </div>
                )}
              </div>

              {/* Edit form */}
              {isEditing && (
                <div style={{ display: "grid", gap: 14 }}>
                  <div>
                    <label style={{ display: "block", fontWeight: 600, fontSize: ".85rem", marginBottom: 6 }}>Label (Name)</label>
                    <input
                      value={editing.label}
                      onChange={e => setEditing(prev => ({ ...prev, label: e.target.value }))}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: ".9rem", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontWeight: 600, fontSize: ".85rem", marginBottom: 6 }}>Max Marks</label>
                    <input
                      type="number" min={1} max={100}
                      value={editing.maxMarks}
                      onChange={e => setEditing(prev => ({ ...prev, maxMarks: e.target.value }))}
                      style={{ width: 120, padding: "9px 12px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: ".9rem" }}
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={editing.isEnabled}
                        onChange={e => setEditing(prev => ({ ...prev, isEnabled: e.target.checked }))}
                        style={{ accentColor: "#6366f1", width: 16, height: 16 }}
                      />
                      <span style={{ fontWeight: 600, fontSize: ".88rem" }}>Enabled</span>
                    </label>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={() => setEditing(null)}
                      style={{ padding: "9px 18px", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "none", cursor: "pointer", fontWeight: 600 }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      style={{
                        padding: "9px 22px", borderRadius: 10, border: "none",
                        background: saving ? "#a5b4fc" : "linear-gradient(135deg,#818cf8,#6366f1)",
                        color: "#fff", cursor: saving ? "not-allowed" : "pointer",
                        fontWeight: 700, boxShadow: "0 2px 10px #6366f140"
                      }}
                    >
                      {saving ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info box */}
      <div style={{ marginTop: 24, padding: "16px 20px", borderRadius: 12, background: "#f0f9ff", border: "1px solid #bae6fd" }}>
        <div style={{ fontWeight: 700, color: "#0369a1", marginBottom: 6 }}>ℹ️ About Exam Types</div>
        <ul style={{ margin: 0, paddingLeft: 20, color: "#0369a1", fontSize: ".84rem", lineHeight: 1.7 }}>
          <li>The system has exactly <strong>4 fixed exam types</strong> — Monthly 1, Midterm, Monthly 2, Final.</li>
          <li>They should sum to <strong>100 marks</strong> total for correct subject calculations.</li>
          <li>Teachers select from these types — they cannot create new exam types.</li>
          <li>Disabling an exam type hides it from the marks entry form.</li>
        </ul>
      </div>
    </div>
  );
}
