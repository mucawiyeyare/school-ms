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

const GRADE_COLOR = { "A+": "#10b981", "A": "#10b981", "B": "#4f46e5", "C": "#f59e0b", "D": "#f97316", "F": "#ef4444" };

export default function ResultsPage() {
  const user = auth.getUser();
  const isAdmin = user?.role === "Admin";
  const [years, setYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);           // All subjects (for fallback)
  const [classSubjects, setClassSubjects] = useState([]); // Subjects for the selected class (junction)
  const [classSubjectsLoading, setClassSubjectsLoading] = useState(false);
  const [examTerms, setExamTerms] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [tab, setTab] = useState("enter");
  const [form, setForm] = useState({ academicYearId: "", classLevelId: "", sectionId: "", examTermId: "", subjectId: "" });
  const [marks, setMarks] = useState({});
  const [maxMarks, setMaxMarks] = useState(100);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // Visibility
  const [visibilities, setVisibilities] = useState({});
  const [visLoading, setVisLoading] = useState(false);
  const [visSaving, setVisSaving] = useState(null);
  // Report card
  const [rcStudentId, setRcStudentId] = useState("");
  const [rcTermId, setRcTermId] = useState("");
  const [reportCard, setReportCard] = useState(null);
  const [rcLoading, setRcLoading] = useState(false);
  // ExamTerm modal
  const [showTermModal, setShowTermModal] = useState(false);
  const [termForm, setTermForm] = useState({ name: "", academicYearId: "", status: "upcoming" });
  const [termSaving, setTermSaving] = useState(false);

  const filteredSections = useMemo(() => sections.filter(s => (s.classLevelId?._id || s.classLevelId) === form.classLevelId), [sections, form.classLevelId]);
  // filteredSubjects: prefer junction-table subjects for selected class; fall back to legacy classLevelId filter
  const filteredSubjects = useMemo(() => {
    if (classSubjects.length > 0) return classSubjects;
    return subjects.filter(s => (s.classLevelId?._id || s.classLevelId) === form.classLevelId);
  }, [classSubjects, subjects, form.classLevelId]);
  const filteredTerms = useMemo(() => examTerms.filter(t => !form.academicYearId || (t.academicYearId?._id || t.academicYearId) === form.academicYearId), [examTerms, form.academicYearId]);

  // Fetch subjects assigned to a class via the junction table
  async function loadClassSubjects(classId) {
    if (!classId) { setClassSubjects([]); return; }
    setClassSubjectsLoading(true);
    try {
      const { data } = await api.get(`/api/classes/${classId}/subjects`);
      setClassSubjects(data || []);
    } catch {
      setClassSubjects([]); // fall back to legacy filter
    } finally {
      setClassSubjectsLoading(false);
    }
  }

  async function loadInit() {
    try {
      const [yR, cR, sR, subR, tR] = await Promise.all([
        api.get("/api/academic-years"), api.get("/api/classes"), api.get("/api/sections"),
        api.get("/api/subjects"), api.get("/api/exam-terms")
      ]);
      const yrs = yR.data || []; const cls = cR.data || []; const secs = sR.data || [];
      setYears(yrs); setClasses(cls); setSections(secs); setSubjects(subR.data || []); setExamTerms(tR.data || []);
      const activeY = yrs.find(y => y.status === "active") || yrs[0];
      const firstC = cls[0];
      const firstS = secs.find(s => (s.classLevelId?._id || s.classLevelId) === firstC?._id);
      const firstT = (tR.data || []).find(t => (t.academicYearId?._id || t.academicYearId) === activeY?._id);
      setForm({ academicYearId: activeY?._id || "", classLevelId: firstC?._id || "", sectionId: firstS?._id || "", examTermId: firstT?._id || "", subjectId: "" });
      // Load subjects for the first class from the junction table
      if (firstC?._id) {
        try {
          const { data } = await api.get(`/api/classes/${firstC._id}/subjects`);
          const classSubs = data || [];
          setClassSubjects(classSubs);
          if (classSubs.length > 0) {
            setForm(prev => ({ ...prev, subjectId: classSubs[0]._id }));
          }
        } catch { setClassSubjects([]); }
      }
    } catch { setError("Failed to load"); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadInit(); }, []);

  // When class changes, reload subjects from junction table and reset subjectId
  async function handleClassChange(newClassId) {
    setForm(f => ({ ...f, classLevelId: newClassId, sectionId: "", subjectId: "" }));
    setClassSubjects([]);
    setVisibilities({}); // Reset visibilities on class change
    if (newClassId) {
      setClassSubjectsLoading(true);
      try {
        const { data } = await api.get(`/api/classes/${newClassId}/subjects`);
        setClassSubjects(data || []);
        if (data?.length > 0) {
          setForm(f => ({ ...f, subjectId: data[0]._id }));
        }
      } catch { setClassSubjects([]); }
      finally { setClassSubjectsLoading(false); }
    }
  }

  // Load visibility settings
  async function loadVisibilitySettings() {
    if (!form.academicYearId || !form.classLevelId) {
      setError("Please select Academic Year and Class first");
      return;
    }
    setVisLoading(true); setError(""); setSuccess("");
    try {
      const { data } = await api.get(`/api/marks/visibility?academicYearId=${form.academicYearId}&classLevelId=${form.classLevelId}`);
      const vMap = {};
      for (const v of data) {
        vMap[v.examTypeCode] = v.isPublished;
      }
      setVisibilities(vMap);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load visibility settings");
    } finally {
      setVisLoading(false);
    }
  }

  // Toggle visibility
  async function toggleVisibility(examTypeCode, currentStatus) {
    setVisSaving(examTypeCode); setError(""); setSuccess("");
    try {
      const { data } = await api.put("/api/marks/visibility", {
        academicYearId: form.academicYearId,
        classLevelId: form.classLevelId,
        examTypeCode,
        isPublished: !currentStatus
      });
      setVisibilities(prev => ({ ...prev, [examTypeCode]: data.isPublished }));
      setSuccess(`Result visibility updated for ${examTypeCode}`);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to update visibility");
    } finally {
      setVisSaving(null);
    }
  }

  async function loadStudents() {
    if (!form.classLevelId || !form.sectionId) return;
    setLoadingStudents(true); setError(""); setSuccess("");
    try {
      const eRes = await api.get(`/api/students?classLevelId=${form.classLevelId}&sectionId=${form.sectionId}&academicYearId=${form.academicYearId}&status=active&limit=1000`);
      const students = eRes.data?.items || [];
      // map to old enrollment shape to avoid rewriting the entire component
      const mapped = students.map(s => ({ _id: s._id, studentId: s }));
      setEnrollments(mapped);
      // Load existing marks if term + subject selected
      if (form.examTermId && form.subjectId) {
        const rRes = await api.get(`/api/results?examTermId=${form.examTermId}&subjectId=${form.subjectId}`);
        const m = {};
        for (const r of (rRes.data || [])) { m[String(r.studentId?._id || r.studentId)] = r.marksObtained; }
        setMarks(m);
      }
    } catch (e) { setError(e?.response?.data?.message || "Failed"); }
    finally { setLoadingStudents(false); }
  }

  async function saveMarks() {
    if (!form.examTermId || !form.subjectId) { setError("Select exam term and subject"); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      const results = enrollments.map(e => {
        const sid = String(e.studentId?._id || e.studentId);
        return { studentId: sid, examTermId: form.examTermId, subjectId: form.subjectId, marksObtained: Number(marks[sid] || 0), maxMarks: Number(maxMarks) };
      });
      await api.post("/api/results/bulk", { results });
      setSuccess(`Saved marks for ${results.length} students!`);
    } catch (e) { setError(e?.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  }

  async function loadReportCard() {
    if (!rcStudentId || !rcTermId) { setError("Select student and exam term"); return; }
    setRcLoading(true); setError("");
    try {
      const { data } = await api.get(`/api/results/report-card/${rcStudentId}/${rcTermId}`);
      setReportCard(data);
    } catch (e) { setError(e?.response?.data?.message || "Failed"); }
    finally { setRcLoading(false); }
  }

  async function saveTerm() {
    setTermSaving(true);
    try {
      await api.post("/api/exam-terms", termForm);
      const tR = await api.get("/api/exam-terms");
      setExamTerms(tR.data || []);
      setShowTermModal(false);
    } catch (e) { setError(e?.response?.data?.message || "Failed"); }
    finally { setTermSaving(false); }
  }

  if (loading) return <div style={{ padding: 32, color: "var(--text-muted)" }}>Loading...</div>;

  return (
    <div>
      <div className="page-header"><h1>Exams & Results</h1><p>Enter marks, manage exam terms, and view report cards.</p></div>
      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}

      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <div className="tabs">
          <button className={`tab ${tab === "enter" ? "active" : ""}`} onClick={() => setTab("enter")}>Enter Marks</button>
          <button className={`tab ${tab === "report" ? "active" : ""}`} onClick={() => setTab("report")}>Report Card</button>
          {isAdmin && <button className={`tab ${tab === "publish" ? "active" : ""}`} onClick={() => { setTab("publish"); setVisibilities({}); }}>Publish Results</button>}
        </div>
        {isAdmin && <button className="btn btn-secondary btn-sm" onClick={() => setShowTermModal(true)}>+ Exam Term</button>}
      </div>

      {tab === "enter" && (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><div className="card-title">Filters</div></div>
            <div className="card-body">
              <div className="form-grid form-grid-3" style={{ gap: 12 }}>
                <div className="form-group"><label className="form-label">Academic Year</label>
                  <select className="form-select" value={form.academicYearId} onChange={e => setForm(f=>({...f,academicYearId:e.target.value}))}>
                    {years.map(y=><option key={y._id} value={y._id}>{y.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Class</label>
                  <select className="form-select" value={form.classLevelId} onChange={e => handleClassChange(e.target.value)}>
                    {classes.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Section</label>
                  <select className="form-select" value={form.sectionId} onChange={e => setForm(f=>({...f,sectionId:e.target.value}))}>
                    {filteredSections.map(s=><option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Exam Term</label>
                  <select className="form-select" value={form.examTermId} onChange={e => setForm(f=>({...f,examTermId:e.target.value}))}>
                    <option value="">Select term</option>
                    {filteredTerms.map(t=><option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    Subject
                    {classSubjectsLoading && (
                      <span style={{ fontSize: ".7rem", color: "var(--text-muted)", fontWeight: 400 }}>Loading...</span>
                    )}
                    {!classSubjectsLoading && filteredSubjects.length === 0 && form.classLevelId && (
                      <span style={{ fontSize: ".7rem", color: "#ef4444", fontWeight: 400 }}>No subjects assigned to this class</span>
                    )}
                  </label>
                  <select className="form-select" value={form.subjectId} onChange={e => setForm(f=>({...f,subjectId:e.target.value}))} disabled={classSubjectsLoading}>
                    <option value="">{classSubjectsLoading ? "Loading subjects..." : filteredSubjects.length === 0 ? "— No subjects assigned —" : "Select subject"}</option>
                    {filteredSubjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Max Marks</label>
                  <input className="form-input" type="number" value={maxMarks} onChange={e => setMaxMarks(e.target.value)} min={1} />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <button className="btn btn-primary" onClick={loadStudents} disabled={loadingStudents}>{loadingStudents ? "Loading..." : "Load Students"}</button>
              </div>
            </div>
          </div>

          {enrollments.length > 0 && (
            <div className="card animate-fade">
              <div className="card-header">
                <div className="card-title">Enter Marks — {enrollments.length} students</div>
                <button className="btn btn-primary" onClick={saveMarks} disabled={saving}>{saving ? "Saving..." : "Save Marks"}</button>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>#</th><th>Student</th><th>Marks / {maxMarks}</th><th>Grade</th></tr></thead>
                    <tbody>
                      {enrollments.map((e, i) => {
                        const sid = String(e.studentId?._id || e.studentId);
                        const m = marks[sid] ?? "";
                        const pct = maxMarks > 0 && m !== "" ? (Number(m) / maxMarks) * 100 : null;
                        const grade = pct === null ? "" : pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B" : pct >= 60 ? "C" : pct >= 50 ? "D" : "F";
                        return (
                          <tr key={e._id}>
                            <td className="td-muted">{i + 1}</td>
                            <td style={{ fontWeight: 600 }}>{e.studentId?.firstName} {e.studentId?.lastName}</td>
                            <td style={{ width: 140 }}>
                              <input className="form-input" type="number" min={0} max={maxMarks} value={m} onChange={ev => setMarks(mk => ({ ...mk, [sid]: ev.target.value }))} style={{ width: 90 }} />
                            </td>
                            <td><span style={{ padding: "3px 10px", borderRadius: 999, background: GRADE_COLOR[grade] ? GRADE_COLOR[grade] + "20" : "#f1f5f9", color: GRADE_COLOR[grade] || "var(--text-light)", fontWeight: 700, fontSize: ".8rem" }}>{grade || "—"}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {tab === "report" && (
        <div className="card">
          <div className="card-header"><div className="card-title">View Report Card</div></div>
          <div className="card-body">
            <div className="form-grid form-grid-3" style={{ gap: 12, marginBottom: 14 }}>
              <div className="form-group"><label className="form-label">Class/Section (load first)</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <select className="form-select" value={form.classLevelId} onChange={e => setForm(f=>({...f,classLevelId:e.target.value}))}>
                    {classes.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                  <select className="form-select" value={form.sectionId} onChange={e => setForm(f=>({...f,sectionId:e.target.value}))} style={{ width: 100 }}>
                    {filteredSections.map(s=><option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                  <button className="btn btn-secondary btn-sm" onClick={loadStudents}>Load</button>
                </div>
              </div>
              <div className="form-group"><label className="form-label">Student</label>
                <select className="form-select" value={rcStudentId} onChange={e => setRcStudentId(e.target.value)}>
                  <option value="">Select</option>
                  {enrollments.map(e => <option key={e._id} value={e.studentId?._id || e.studentId}>{e.studentId?.firstName} {e.studentId?.lastName}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Exam Term</label>
                <select className="form-select" value={rcTermId} onChange={e => setRcTermId(e.target.value)}>
                  <option value="">Select</option>
                  {examTerms.map(t=><option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <button className="btn btn-primary" onClick={loadReportCard} disabled={rcLoading}>{rcLoading ? "Loading..." : "View Report Card"}</button>

            {reportCard && (
              <div className="animate-fade" style={{ marginTop: 24 }}>
                <div style={{ background: "linear-gradient(135deg, #312e81, #1e40af)", borderRadius: "var(--radius-lg)", padding: "20px 24px", marginBottom: 16, color: "#fff" }}>
                  <div style={{ fontSize: ".75rem", opacity: .7, textTransform: "uppercase", letterSpacing: ".08em" }}>Report Card</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800, marginTop: 4 }}>{reportCard.student.firstName} {reportCard.student.lastName}</div>
                  <div style={{ fontSize: ".85rem", opacity: .8 }}>{reportCard.examTerm?.name || "Exam Term"}</div>
                  <div style={{ display: "flex", gap: 24, marginTop: 12 }}>
                    <div><div style={{ fontSize: "1.4rem", fontWeight: 800 }}>{reportCard.summary.percentage}%</div><div style={{ fontSize: ".72rem", opacity: .7 }}>Percentage</div></div>
                    <div><div style={{ fontSize: "1.4rem", fontWeight: 800 }}>{reportCard.summary.totalObtained}/{reportCard.summary.totalMax}</div><div style={{ fontSize: ".72rem", opacity: .7 }}>Total Marks</div></div>
                  </div>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Subject</th><th>Code</th><th>Marks</th><th>Max</th><th>Grade</th></tr></thead>
                    <tbody>
                      {reportCard.results.map(r => (
                        <tr key={r._id}>
                          <td style={{ fontWeight: 600 }}>{r.subjectId?.name}</td>
                          <td><span className="badge badge-blue">{r.subjectId?.code}</span></td>
                          <td style={{ fontWeight: 700 }}>{r.marksObtained}</td>
                          <td className="td-muted">{r.maxMarks}</td>
                          <td><span style={{ padding: "3px 10px", borderRadius: 999, background: (GRADE_COLOR[r.grade] || "#ccc") + "25", color: GRADE_COLOR[r.grade] || "#999", fontWeight: 700, fontSize: ".8rem" }}>{r.grade}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "publish" && isAdmin && (
        <div className="card animate-fade">
          <div className="card-header"><div className="card-title">Manage Result Visibility</div></div>
          <div className="card-body">
            <p style={{ fontSize: ".82rem", color: "var(--text-muted)", marginBottom: 20 }}>
              Control which exam results are visible to students for the <strong>Active</strong> academic year. 
              Results for archived years are always visible as historical data.
            </p>
            <div className="form-grid form-grid-3" style={{ gap: 12, marginBottom: 20 }}>
              <div className="form-group"><label className="form-label">Academic Year</label>
                <select className="form-select" value={form.academicYearId} onChange={e => setForm(f=>({...f,academicYearId:e.target.value}))}>
                  {years.map(y=><option key={y._id} value={y._id}>{y.name} {y.status === "archived" ? "(Archived)" : "(Active)"}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Class</label>
                <select className="form-select" value={form.classLevelId} onChange={e => handleClassChange(e.target.value)}>
                  {classes.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ display: "flex", alignItems: "flex-end" }}>
                <button className="btn btn-primary" onClick={loadVisibilitySettings} disabled={visLoading || !form.academicYearId || !form.classLevelId}>
                  {visLoading ? "Loading..." : "Load Settings"}
                </button>
              </div>
            </div>

            {Object.keys(visibilities).length > 0 && !visLoading && (
              <div style={{ background: "#f8fafc", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-light)", overflow: "hidden" }}>
                <table style={{ minWidth: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ width: "40%" }}>Exam Type</th>
                      <th>Visibility Status</th>
                      <th style={{ textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { code: "monthly1", label: "Monthly 1" },
                      { code: "midterm",  label: "Mid-Term" },
                      { code: "monthly2", label: "Monthly 2" },
                      { code: "final",    label: "Final" }
                    ].map(et => {
                      const isPub = !!visibilities[et.code];
                      return (
                        <tr key={et.code}>
                          <td style={{ fontWeight: 600 }}>{et.label}</td>
                          <td>
                            {isPub ? (
                              <span className="badge badge-green">✓ Published</span>
                            ) : (
                              <span className="badge badge-gray">Hidden</span>
                            )}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button 
                              className={`btn btn-sm ${isPub ? "btn-warning" : "btn-primary"}`}
                              onClick={() => toggleVisibility(et.code, isPub)}
                              disabled={visSaving === et.code}
                            >
                              {visSaving === et.code ? "Saving..." : isPub ? "Hide Results" : "Publish Results"}
                            </button>
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
      )}

      {/* Exam Term Modal */}
      <Modal visible={showTermModal} onClose={() => setShowTermModal(false)} title="Create Exam Term" size="modal-sm">
        <div className="modal-body">
          <div className="form-grid" style={{ gap: 12 }}>
            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={termForm.name} onChange={e=>setTermForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Midterm 2025" /></div>
            <div className="form-group"><label className="form-label">Academic Year</label>
              <select className="form-select" value={termForm.academicYearId} onChange={e=>setTermForm(f=>({...f,academicYearId:e.target.value}))}>
                <option value="">Select year</option>
                {years.map(y=><option key={y._id} value={y._id}>{y.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Status</label>
              <select className="form-select" value={termForm.status} onChange={e=>setTermForm(f=>({...f,status:e.target.value}))}>
                {["upcoming","ongoing","completed"].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowTermModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={saveTerm} disabled={termSaving}>{termSaving ? "Saving..." : "Create Term"}</button>
        </div>
      </Modal>
    </div>
  );
}
