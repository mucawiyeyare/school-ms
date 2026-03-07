import { useState, useEffect } from "react";
import { api } from "../lib/api";

export default function TeacherAssignments() {
  const [teachers, setTeachers]     = useState([]);
  const [subjects, setSubjects]     = useState([]);
  const [classes, setClasses]       = useState([]);
  const [sections, setSections]     = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [form, setForm] = useState({
    teacherId: "", subjectId: "", classLevelId: "", sectionId: "", academicYearId: ""
  });
  const [filterTeacher, setFilterTeacher] = useState("");
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  // Load all base data
  useEffect(() => {
    Promise.all([
      api.get("/api/teachers"),
      api.get("/api/subjects"),
      api.get("/api/classes"),
      api.get("/api/academic-years")
    ]).then(([t, s, c, y]) => {
      setTeachers(t.data || []);
      setSubjects(s.data || []);
      setClasses(c.data || []);
      setAcademicYears(y.data || []);
      const active = (y.data || []).find(yr => yr.status === "active");
      if (active) setForm(p => ({ ...p, academicYearId: active._id }));
    }).catch(() => setError("Failed to load data"));
  }, []);

  // Load sections when class changes in form
  useEffect(() => {
    if (!form.classLevelId) { setSections([]); setForm(p => ({ ...p, sectionId: "" })); return; }
    api.get(`/api/sections?classLevelId=${form.classLevelId}`)
      .then(r => setSections(r.data || []));
  }, [form.classLevelId]);

  // Load assignments
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterTeacher) params.append("teacherId", filterTeacher);
    api.get(`/api/marks/assignments?${params}`)
      .then(r => setAssignments(r.data || []))
      .catch(() => setAssignments([]))
      .finally(() => setLoading(false));
  }, [filterTeacher, success]);

  async function handleAdd() {
    if (!form.teacherId || !form.subjectId || !form.classLevelId)
      return setError("Teacher, Subject and Class are required");
    setSaving(true);
    setError("");
    try {
      await api.post("/api/marks/assignments", form);
      setSuccess("Assignment created!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to add assignment");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Remove this assignment?")) return;
    try {
      await api.delete(`/api/marks/assignments/${id}`);
      setAssignments(prev => prev.filter(a => a._id !== id));
    } catch (e) {
      setError("Failed to delete");
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 0 40px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>Teacher Subject Assignments</h1>
        <p style={{ color: "#6b7280", fontSize: ".9rem", margin: "4px 0 0" }}>
          Assign teachers to subjects, classes, and sections. Teachers can only enter marks for assigned subjects.
        </p>
      </div>

      {/* Add form */}
      <div className="card" style={{ padding: 22, borderRadius: 14, marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 16px", fontWeight: 700, fontSize: "1rem" }}>➕ Add New Assignment</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ display: "block", fontWeight: 600, fontSize: ".82rem", marginBottom: 5 }}>Teacher *</label>
            <select value={form.teacherId} onChange={e => setForm(p => ({ ...p, teacherId: e.target.value }))}
              style={{ width: "100%", padding: "9px 10px", borderRadius: 9, border: "1.5px solid #e5e7eb", fontSize: ".85rem" }}>
              <option value="">-- Select --</option>
              {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontWeight: 600, fontSize: ".82rem", marginBottom: 5 }}>Class *</label>
            <select value={form.classLevelId} onChange={e => setForm(p => ({ ...p, classLevelId: e.target.value }))}
              style={{ width: "100%", padding: "9px 10px", borderRadius: 9, border: "1.5px solid #e5e7eb", fontSize: ".85rem" }}>
              <option value="">-- Select --</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontWeight: 600, fontSize: ".82rem", marginBottom: 5 }}>Section</label>
            <select value={form.sectionId} onChange={e => setForm(p => ({ ...p, sectionId: e.target.value }))}
              disabled={!form.classLevelId}
              style={{ width: "100%", padding: "9px 10px", borderRadius: 9, border: "1.5px solid #e5e7eb", fontSize: ".85rem", opacity: form.classLevelId ? 1 : .5 }}>
              <option value="">-- All Sections --</option>
              {sections.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontWeight: 600, fontSize: ".82rem", marginBottom: 5 }}>Subject *</label>
            <select value={form.subjectId} onChange={e => setForm(p => ({ ...p, subjectId: e.target.value }))}
              style={{ width: "100%", padding: "9px 10px", borderRadius: 9, border: "1.5px solid #e5e7eb", fontSize: ".85rem" }}>
              <option value="">-- Select --</option>
              {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontWeight: 600, fontSize: ".82rem", marginBottom: 5 }}>Academic Year</label>
            <select value={form.academicYearId} onChange={e => setForm(p => ({ ...p, academicYearId: e.target.value }))}
              style={{ width: "100%", padding: "9px 10px", borderRadius: 9, border: "1.5px solid #e5e7eb", fontSize: ".85rem" }}>
              <option value="">-- Select --</option>
              {academicYears.map(y => <option key={y._id} value={y._id}>{y.name}</option>)}
            </select>
          </div>
        </div>

        {error && <div style={{ marginBottom: 10, color: "#dc2626", fontWeight: 600, fontSize: ".85rem" }}>⚠️ {error}</div>}
        {success && <div style={{ marginBottom: 10, color: "#065f46", fontWeight: 600, fontSize: ".85rem" }}>✅ {success}</div>}

        <button onClick={handleAdd} disabled={saving}
          style={{
            padding: "10px 24px", borderRadius: 10,
            background: saving ? "#a5b4fc" : "linear-gradient(135deg,#818cf8,#6366f1)",
            color: "#fff", border: "none", cursor: "pointer", fontWeight: 700,
            boxShadow: "0 2px 10px #6366f140"
          }}>
          {saving ? "Saving…" : "Add Assignment"}
        </button>
      </div>

      {/* Existing assignments */}
      <div className="card" style={{ borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 12 }}>
          <h3 style={{ margin: 0, fontWeight: 700, flex: 1 }}>Existing Assignments</h3>
          <div>
            <select value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 9, border: "1.5px solid #e5e7eb", fontSize: ".85rem" }}>
              <option value="">All Teachers</option>
              {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Loading…</div>
        ) : assignments.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>No assignments found.</div>
        ) : (
          <div className="table-wrap">
            <table style={{ minWidth: 600, width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["Teacher", "Subject", "Class", "Section", "Academic Year", ""].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, fontSize: ".8rem", color: "#6b7280", borderBottom: "2px solid #e5e7eb" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assignments.map(a => (
                  <tr key={a._id} style={{ borderBottom: "1px solid #f3f4f6" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                    onMouseLeave={e => e.currentTarget.style.background = ""}>
                    <td style={{ padding: "10px 14px", fontWeight: 600 }}>{a.teacherId?.name || "—"}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontWeight: 600 }}>{a.subjectId?.name}</span>
                      <span style={{ fontSize: ".75rem", color: "#9ca3af", marginLeft: 6 }}>{a.subjectId?.code}</span>
                    </td>
                    <td style={{ padding: "10px 14px", color: "#374151" }}>{a.classLevelId?.name || "—"}</td>
                    <td style={{ padding: "10px 14px", color: "#374151" }}>{a.sectionId?.name || <span style={{ color: "#d1d5db" }}>All</span>}</td>
                    <td style={{ padding: "10px 14px", color: "#374151" }}>{a.academicYearId?.name || "—"}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <button onClick={() => handleDelete(a._id)}
                        style={{ padding: "5px 12px", borderRadius: 7, border: "1.5px solid #fca5a5", background: "#fef2f2", color: "#dc2626", cursor: "pointer", fontWeight: 600, fontSize: ".78rem" }}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
