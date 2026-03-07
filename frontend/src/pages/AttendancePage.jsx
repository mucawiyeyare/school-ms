import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

const STATUS_COLORS = { present: "#10b981", absent: "#ef4444", late: "#f59e0b", excused: "#8b5cf6" };
const STATUS_BG = { present: "#d1fae5", absent: "#fee2e2", late: "#fef3c7", excused: "#ede9fe" };
const STATUSES = ["present", "absent", "late", "excused"];

export default function AttendancePage() {
  const [years, setYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [form, setForm] = useState({ academicYearId: "", classLevelId: "", sectionId: "", date: new Date().toISOString().split("T")[0], period: "Morning" });
  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [existingAttendance, setExistingAttendance] = useState(null);

  const filteredSections = useMemo(() => sections.filter(s => (s.classLevelId?._id || s.classLevelId) === form.classLevelId), [sections, form.classLevelId]);

  async function loadInit() {
    try {
      const [yRes, cRes, sRes] = await Promise.all([api.get("/api/academic-years"), api.get("/api/classes"), api.get("/api/sections")]);
      const yrs = yRes.data || [];
      const cls = cRes.data || [];
      const secs = sRes.data || [];
      setYears(yrs); setClasses(cls); setSections(secs);
      const activeY = yrs.find(y => y.status === "active") || yrs[0];
      const firstC = cls[0];
      const firstS = secs.find(s => (s.classLevelId?._id || s.classLevelId) === firstC?._id);
      setForm(f => ({ ...f, academicYearId: activeY?._id || "", classLevelId: firstC?._id || "", sectionId: firstS?._id || "" }));
    } catch (e) { setError("Failed to load"); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadInit(); }, []);

  async function loadStudents() {
    if (!form.classLevelId || !form.sectionId) return;
    setLoadingStudents(true); setError(""); setSuccess(""); setExistingAttendance(null);
    try {
      // Get enrolled students
      const eRes = await api.get(`/api/students?classLevelId=${form.classLevelId}&sectionId=${form.sectionId}&academicYearId=${form.academicYearId}&status=active&limit=1000`);
      const students = eRes.data?.items || [];
      const enr = students.map(s => ({ _id: s._id, studentId: s }));
      setEnrollments(enr);

      // Check existing attendance for that day
      const aRes = await api.get(`/api/attendance?classLevelId=${form.classLevelId}&sectionId=${form.sectionId}&date=${form.date}`);
      const existing = (aRes.data || []).find(a => a.period === form.period);
      if (existing) {
        setExistingAttendance(existing);
        const recs = {};
        enr.forEach(e => {
          const found = existing.records.find(r => String(r.studentId?._id || r.studentId) === String(e.studentId?._id || e.studentId));
          recs[String(e.studentId?._id || e.studentId)] = found ? found.status : "present";
        });
        setRecords(recs);
      } else {
        const recs = {};
        enr.forEach(e => { recs[String(e.studentId?._id || e.studentId)] = "present"; });
        setRecords(recs);
      }
    } catch (e) { setError(e?.response?.data?.message || "Failed to load students"); }
    finally { setLoadingStudents(false); }
  }

  function setAll(status) {
    setRecords(r => { const n = { ...r }; Object.keys(n).forEach(k => n[k] = status); return n; });
  }

  async function save() {
    if (enrollments.length === 0) { setError("Load students first"); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      const recordsArr = enrollments.map(e => {
        const sid = String(e.studentId?._id || e.studentId);
        return { studentId: sid, status: records[sid] || "present" };
      });
      await api.post("/api/attendance", { ...form, records: recordsArr });
      setSuccess("Attendance saved!");
    } catch (e) { setError(e?.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  }

  const summary = STATUSES.reduce((acc, s) => { acc[s] = Object.values(records).filter(v => v === s).length; return acc; }, {});

  if (loading) return <div style={{ padding: 32, color: "var(--text-muted)" }}>Loading...</div>;

  return (
    <div>
      <div className="page-header"><h1>Attendance</h1><p>Take and manage daily class attendance records.</p></div>
      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}
      {existingAttendance && <div className="alert alert-info" style={{ marginBottom: 16 }}>⚡ Editing existing attendance record for this date and period.</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><div className="card-title">Setup</div></div>
        <div className="card-body">
          <div className="form-grid form-grid-4" style={{ gap: 12 }}>
            <div className="form-group"><label className="form-label">Academic Year</label>
              <select className="form-select" value={form.academicYearId} onChange={e => setForm(f => ({ ...f, academicYearId: e.target.value }))}>
                {years.map(y => <option key={y._id} value={y._id}>{y.name} {y.status === "active" ? "(active)" : ""}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Class</label>
              <select className="form-select" value={form.classLevelId} onChange={e => { const cls = e.target.value; const firstS = sections.find(s => (s.classLevelId?._id || s.classLevelId) === cls); setForm(f => ({ ...f, classLevelId: cls, sectionId: firstS?._id || "" })); }}>
                {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Section</label>
              <select className="form-select" value={form.sectionId} onChange={e => setForm(f => ({ ...f, sectionId: e.target.value }))}>
                {filteredSections.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Date</label>
              <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div className="form-group" style={{ minWidth: 160 }}>
              <select className="form-select" value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}>
                {["Morning", "Afternoon", "Evening", "Period 1", "Period 2", "Period 3"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={loadStudents} disabled={loadingStudents}>{loadingStudents ? "Loading..." : "Load Students"}</button>
          </div>
        </div>
      </div>

      {enrollments.length > 0 && (
        <div className="card animate-fade">
          <div className="card-header">
            <div>
              <div className="card-title">Students ({enrollments.length})</div>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                {STATUSES.map(s => <span key={s} style={{ fontSize: ".75rem", fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: STATUS_BG[s], color: STATUS_COLORS[s] }}>{s}: {summary[s]}</span>)}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {STATUSES.map(s => (
                <button key={s} className="btn btn-sm" style={{ background: STATUS_BG[s], color: STATUS_COLORS[s], border: "none", fontWeight: 600 }} onClick={() => setAll(s)}>All {s}</button>
              ))}
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Attendance"}</button>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Student</th>{STATUSES.map(s => <th key={s} style={{ textAlign: "center" }}>{s.charAt(0).toUpperCase()+s.slice(1)}</th>)}</tr></thead>
                <tbody>
                  {enrollments.map((e, i) => {
                    const sid = String(e.studentId?._id || e.studentId);
                    return (
                      <tr key={e._id}>
                        <td className="td-muted" style={{ width: 40 }}>{i + 1}</td>
                        <td><div style={{ fontWeight: 600 }}>{e.studentId?.firstName} {e.studentId?.lastName}</div></td>
                        {STATUSES.map(s => (
                          <td key={s} style={{ textAlign: "center" }}>
                            <label style={{ cursor: "pointer", display: "block", padding: "4px 0" }}>
                              <input type="radio" name={`att-${sid}`} value={s} checked={records[sid] === s} onChange={() => setRecords(r => ({ ...r, [sid]: s }))} style={{ accentColor: STATUS_COLORS[s] }} />
                            </label>
                          </td>
                        ))}
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
  );
}
