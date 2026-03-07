import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { auth } from "../lib/auth";

const EXAM_TYPE_COLORS = {
  monthly1: { bg: "#ede9fe", color: "#6d28d9", border: "#c4b5fd" },
  midterm:  { bg: "#dbeafe", color: "#1d4ed8", border: "#93c5fd" },
  monthly2: { bg: "#fef9c3", color: "#854d0e", border: "#fde047" },
  final:    { bg: "#dcfce7", color: "#15803d", border: "#86efac" },
};

function Badge({ code, label }) {
  const c = EXAM_TYPE_COLORS[code] || { bg: "#f3f4f6", color: "#374151", border: "#d1d5db" };
  return (
    <span style={{
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      borderRadius: 6, padding: "2px 10px", fontSize: ".75rem", fontWeight: 700, letterSpacing: ".04em"
    }}>{label}</span>
  );
}

function Step({ num, label, active, done }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: ".8rem",
        background: done ? "#10b981" : active ? "linear-gradient(135deg,#818cf8,#6366f1)" : "var(--surface-2,#f3f4f6)",
        color: done || active ? "#fff" : "#9ca3af",
        boxShadow: active ? "0 2px 10px #6366f140" : "none",
        transition: "all .3s"
      }}>
        {done ? "✓" : num}
      </div>
      <span style={{ fontSize: ".82rem", fontWeight: 600, color: active ? "var(--text)" : "#9ca3af", transition: "color .3s" }}>{label}</span>
    </div>
  );
}

export default function MarksEntry() {
  const user = auth.getUser();
  const isAdmin = user?.role === "Admin";

  // Step state
  const [step, setStep] = useState(1);

  // Selection state
  const [academicYears, setAcademicYears]   = useState([]);
  const [examTypes, setExamTypes]           = useState([]);
  const [classes, setClasses]               = useState([]);
  const [sections, setSections]             = useState([]);
  const [subjects, setSubjects]             = useState([]);
  const [students, setStudents]             = useState([]);
  const [existingMarks, setExistingMarks]   = useState({});   // studentId -> marks value

  const [selYear, setSelYear]       = useState("");
  const [selExam, setSelExam]       = useState("");
  const [selClass, setSelClass]     = useState("");
  const [selSection, setSelSection] = useState("");
  const [selSubject, setSelSubject] = useState("");
  const [marksInput, setMarksInput] = useState({});           // studentId -> inputValue

  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [errors, setErrors]         = useState({});
  const [globalError, setGlobalError] = useState("");

  // Load initial data
  useEffect(() => {
    Promise.all([
      api.get("/api/academic-years"),
      api.get("/api/marks/exam-types"),
      api.get("/api/classes")
    ]).then(([yr, et, cls]) => {
      setAcademicYears(yr.data || []);
      setExamTypes((et.data || []).filter(e => e.isEnabled));
      setClasses(cls.data || []);
      // Default to active academic year
      const active = (yr.data || []).find(y => y.status === "active");
      if (active) setSelYear(active._id);
    }).catch(() => setGlobalError("Failed to load initial data"));
  }, []);

  // Load sections when class changes
  useEffect(() => {
    if (!selClass) { setSections([]); setSelSection(""); return; }
    api.get(`/api/sections?classLevelId=${selClass}`)
      .then(r => setSections(r.data || []))
      .catch(() => setSections([]));
      setSelSection("");
  }, [selClass]);

  // Load subjects when class/section/year changes
  const loadSubjects = useCallback(() => {
    if (!selClass || !selYear) { setSubjects([]); setSelSubject(""); return; }
    const params = new URLSearchParams({ classLevelId: selClass, academicYearId: selYear });
    if (selSection) params.append("sectionId", selSection);
    api.get(`/api/marks/my-subjects?${params}`)
      .then(r => setSubjects(r.data || []))
      .catch(() => setSubjects([]));
    setSelSubject("");
  }, [selClass, selSection, selYear]);

  useEffect(() => { loadSubjects(); }, [loadSubjects]);

  // Load students & existing marks when all selections are made
  const loadStudentsAndMarks = useCallback(async () => {
    if (!selYear || !selClass || !selSection || !selSubject || !selExam) return;
    setLoading(true);
    setGlobalError("");
    try {
      const [studRes, marksRes] = await Promise.all([
        api.get(`/api/marks/students?academicYearId=${selYear}&classLevelId=${selClass}&sectionId=${selSection}`),
        api.get(`/api/marks?academicYearId=${selYear}&classLevelId=${selClass}&sectionId=${selSection}&subjectId=${selSubject}&examTypeCode=${selExam}`)
      ]);
      setStudents(studRes.data || []);
      const mMap = {};
      for (const m of (marksRes.data || [])) {
        mMap[String(m.studentId?._id || m.studentId)] = m.marks;
      }
      setExistingMarks(mMap);
      // Pre-fill input with existing marks
      const inputMap = {};
      for (const s of (studRes.data || [])) {
        const id = String(s._id);
        inputMap[id] = mMap[id] !== undefined ? String(mMap[id]) : "";
      }
      setMarksInput(inputMap);
      setSaved(false);
      setErrors({});
    } catch (e) {
      setGlobalError(e.response?.data?.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [selYear, selClass, selSection, selSubject, selExam]);

  useEffect(() => {
    if (step === 5) loadStudentsAndMarks();
  }, [step, loadStudentsAndMarks]);

  const selectedExamType = examTypes.find(e => e.code === selExam);
  const selectedYearObj   = academicYears.find(y => y._id === selYear);
  const selectedClassObj  = classes.find(c => c._id === selClass);
  const selectedSection   = sections.find(s => s._id === selSection);
  const selectedSubjectObj = subjects.find(s => s._id === selSubject);

  function validateMarks() {
    const errs = {};
    const max = selectedExamType?.maxMarks ?? 100;
    for (const [sid, val] of Object.entries(marksInput)) {
      if (val === "" || val === undefined) continue;
      const n = Number(val);
      if (isNaN(n) || n < 0 || n > max) {
        errs[sid] = `0 – ${max}`;
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validateMarks()) return;
    setSaving(true);
    setGlobalError("");
    try {
      const entries = students.map(s => ({
        studentId: s._id,
        marks: marksInput[String(s._id)] !== "" ? marksInput[String(s._id)] : undefined
      })).filter(e => e.marks !== undefined);

      await api.post("/api/marks/bulk-save", {
        academicYearId: selYear,
        classLevelId:   selClass,
        sectionId:      selSection,
        subjectId:      selSubject,
        examTypeCode:   selExam,
        entries
      });
      setSaved(true);
      // Reload to get updated existing marks
      await loadStudentsAndMarks();
    } catch (e) {
      setGlobalError(e.response?.data?.message || "Failed to save marks");
    } finally {
      setSaving(false);
    }
  }

  function canProceed() {
    if (step === 1) return !!selYear;
    if (step === 2) return !!selExam;
    if (step === 3) return !!selClass && !!selSection;
    if (step === 4) return !!selSubject;
    return false;
  }

  const steps = [
    { label: "Academic Year" },
    { label: "Exam Type" },
    { label: "Class & Section" },
    { label: "Subject" },
    { label: "Enter Marks" },
  ];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 0 40px" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>Enter Marks</h1>
        <p style={{ color: "var(--text-2,#6b7280)", fontSize: ".9rem", margin: "4px 0 0" }}>
          Select options step-by-step to enter or edit student marks.
        </p>
      </div>

      {/* Step indicator */}
      <div style={{
        display: "flex", alignItems: "center", gap: 0,
        background: "var(--surface)", borderRadius: 14,
        padding: "16px 20px", marginBottom: 24,
        boxShadow: "0 1px 6px #0001", overflowX: "auto"
      }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{ cursor: i < step - 1 ? "pointer" : "default" }}
              onClick={() => { if (i < step - 1) setStep(i + 1); }}
            >
              <Step num={i + 1} label={s.label} active={step === i + 1} done={step > i + 1} />
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 28, height: 2, background: step > i + 1 ? "#10b981" : "#e5e7eb", margin: "0 8px", borderRadius: 2, flexShrink: 0 }} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="card" style={{ padding: 28, borderRadius: 16, boxShadow: "0 2px 16px #0001" }}>

        {/* ── STEP 1: Academic Year ── */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: 16 }}>Select Academic Year</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {academicYears.map(y => (
                <label key={y._id} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "14px 18px",
                  border: `2px solid ${selYear === y._id ? "#6366f1" : "#e5e7eb"}`,
                  borderRadius: 12, cursor: "pointer",
                  background: selYear === y._id ? "#eef2ff" : "var(--surface)",
                  transition: "all .2s"
                }}>
                  <input type="radio" name="year" value={y._id} checked={selYear === y._id}
                    onChange={() => setSelYear(y._id)} style={{ accentColor: "#6366f1" }} />
                  <span style={{ fontWeight: 600 }}>{y.name}</span>
                  {y.status === "active" && (
                    <span style={{ marginLeft: "auto", background: "#d1fae5", color: "#065f46", borderRadius: 20, padding: "2px 10px", fontSize: ".75rem", fontWeight: 700 }}>Active</span>
                  )}
                </label>
              ))}
              {academicYears.length === 0 && <p style={{ color: "#9ca3af" }}>No academic years found.</p>}
            </div>
          </div>
        )}

        {/* ── STEP 2: Exam Type ── */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: 16 }}>Select Exam Type</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
              {examTypes.map(et => {
                const c = EXAM_TYPE_COLORS[et.code] || {};
                return (
                  <label key={et.code} style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                    padding: "20px 16px",
                    border: `2px solid ${selExam === et.code ? (c.border || "#6366f1") : "#e5e7eb"}`,
                    borderRadius: 14, cursor: "pointer",
                    background: selExam === et.code ? (c.bg || "#eef2ff") : "var(--surface)",
                    transition: "all .2s", textAlign: "center"
                  }}>
                    <input type="radio" name="exam" value={et.code} checked={selExam === et.code}
                      onChange={() => setSelExam(et.code)} style={{ display: "none" }} />
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: c.bg || "#eef2ff", border: `2px solid ${c.border || "#c7d2fe"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "1.4rem"
                    }}>
                      {et.code === "monthly1" ? "📝" : et.code === "midterm" ? "📖" : et.code === "monthly2" ? "✏️" : "🎓"}
                    </div>
                    <span style={{ fontWeight: 700, color: c.color || "#374151" }}>{et.label}</span>
                    <span style={{ fontSize: ".78rem", color: "#9ca3af" }}>Max: {et.maxMarks} marks</span>
                    {selExam === et.code && (
                      <span style={{ fontSize: ".7rem", color: c.color, fontWeight: 800 }}>✓ SELECTED</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 3: Class & Section ── */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: 16 }}>Select Class &amp; Section</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 8, fontSize: ".88rem" }}>Class</label>
                <select
                  value={selClass}
                  onChange={e => setSelClass(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: ".9rem", outline: "none" }}
                >
                  <option value="">-- Select Class --</option>
                  {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 8, fontSize: ".88rem" }}>Section</label>
                <select
                  value={selSection}
                  onChange={e => setSelSection(e.target.value)}
                  disabled={!selClass}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: ".9rem", outline: "none", opacity: selClass ? 1 : .5 }}
                >
                  <option value="">-- Select Section --</option>
                  {sections.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: Subject ── */}
        {step === 4 && (
          <div>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: 16 }}>Select Subject</h2>
            {subjects.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "#9ca3af", background: "#f9fafb", borderRadius: 12 }}>
                {isAdmin ? "No subjects found for this class/year." : "You have no assigned subjects for this class/year."}
              </div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {subjects.map(s => (
                  <label key={s._id} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "14px 18px",
                    border: `2px solid ${selSubject === s._id ? "#6366f1" : "#e5e7eb"}`,
                    borderRadius: 12, cursor: "pointer",
                    background: selSubject === s._id ? "#eef2ff" : "var(--surface)",
                    transition: "all .2s"
                  }}>
                    <input type="radio" name="subject" value={s._id} checked={selSubject === s._id}
                      onChange={() => setSelSubject(s._id)} style={{ accentColor: "#6366f1" }} />
                    <div>
                      <div style={{ fontWeight: 700 }}>{s.name}</div>
                      <div style={{ fontSize: ".78rem", color: "#9ca3af" }}>{s.code}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 5: Enter Marks ── */}
        {step === 5 && (
          <div>
            {/* Context bar */}
            <div style={{
              display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center",
              padding: "12px 16px", background: "#f9fafb", borderRadius: 12, marginBottom: 20,
              border: "1px solid #e5e7eb", fontSize: ".82rem"
            }}>
              <span style={{ fontWeight: 700, color: "#6b7280" }}>Year:</span>
              <span style={{ fontWeight: 600 }}>{selectedYearObj?.name}</span>
              <span style={{ color: "#d1d5db" }}>|</span>
              <Badge code={selExam} label={selectedExamType?.label} />
              <span style={{ color: "#d1d5db" }}>|</span>
              <span style={{ fontWeight: 600 }}>{selectedClassObj?.name} – {selectedSection?.name}</span>
              <span style={{ color: "#d1d5db" }}>|</span>
              <span style={{ fontWeight: 600 }}>{selectedSubjectObj?.name}</span>
              <div style={{ marginLeft: "auto", background: "#dbeafe", color: "#1d4ed8", borderRadius: 6, padding: "3px 10px", fontWeight: 700 }}>
                Max: {selectedExamType?.maxMarks} marks
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                <div style={{ fontSize: "2rem", marginBottom: 8 }}>⏳</div>
                Loading students...
              </div>
            ) : students.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#9ca3af", background: "#f9fafb", borderRadius: 12 }}>
                No students found for this class/section.
              </div>
            ) : (
              <>
                {saved && (
                  <div style={{
                    padding: "12px 16px", borderRadius: 10, marginBottom: 16,
                    background: "#d1fae5", color: "#065f46", fontWeight: 600, display: "flex", alignItems: "center", gap: 8
                  }}>
                    <span>✅</span> Marks saved successfully! You can continue editing.
                  </div>
                )}
                <div className="table-wrap">
                  <table style={{ minWidth: 600, width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f9fafb" }}>
                        <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, fontSize: ".82rem", color: "#6b7280", borderBottom: "2px solid #e5e7eb" }}>#</th>
                        <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, fontSize: ".82rem", color: "#6b7280", borderBottom: "2px solid #e5e7eb" }}>Student</th>
                        <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, fontSize: ".82rem", color: "#6b7280", borderBottom: "2px solid #e5e7eb" }}>EMIS No.</th>
                        <th style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, fontSize: ".82rem", color: "#6b7280", borderBottom: "2px solid #e5e7eb" }}>
                          Marks <span style={{ fontWeight: 400, color: "#9ca3af" }}>/ {selectedExamType?.maxMarks}</span>
                        </th>
                        <th style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, fontSize: ".82rem", color: "#6b7280", borderBottom: "2px solid #e5e7eb" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s, idx) => {
                        const sid = String(s._id);
                        const val = marksInput[sid];
                        const existing = existingMarks[sid] !== undefined;
                        const hasError = !!errors[sid];
                        return (
                          <tr key={s._id} style={{ borderBottom: "1px solid #f3f4f6", transition: "background .15s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                            onMouseLeave={e => e.currentTarget.style.background = ""}
                          >
                            <td style={{ padding: "10px 14px", color: "#9ca3af", fontSize: ".82rem" }}>{idx + 1}</td>
                            <td style={{ padding: "10px 14px" }}>
                              <div style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</div>
                            </td>
                            <td style={{ padding: "10px 14px", color: "#6b7280", fontSize: ".84rem" }}>{s.emisNumber || s.rollNumber || "—"}</td>
                            <td style={{ padding: "8px 14px", textAlign: "center" }}>
                              <input
                                type="number"
                                min={0}
                                max={selectedExamType?.maxMarks}
                                step={1}
                                value={val}
                                onChange={e => {
                                  setMarksInput(prev => ({ ...prev, [sid]: e.target.value }));
                                  setSaved(false);
                                  if (errors[sid]) setErrors(prev => { const n = { ...prev }; delete n[sid]; return n; });
                                }}
                                placeholder="—"
                                style={{
                                  width: 80, padding: "7px 10px", borderRadius: 8, textAlign: "center",
                                  border: `1.5px solid ${hasError ? "#ef4444" : "#e5e7eb"}`,
                                  fontSize: ".9rem", fontWeight: 600, outline: "none",
                                  background: hasError ? "#fef2f2" : "var(--surface)"
                                }}
                              />
                              {hasError && <div style={{ fontSize: ".7rem", color: "#ef4444", marginTop: 2 }}>0–{errors[sid]}</div>}
                            </td>
                            <td style={{ padding: "10px 14px", textAlign: "center" }}>
                              {existing ? (
                                <span style={{ background: "#dbeafe", color: "#1d4ed8", borderRadius: 20, padding: "2px 10px", fontSize: ".72rem", fontWeight: 700 }}>Saved</span>
                              ) : val ? (
                                <span style={{ background: "#fef9c3", color: "#854d0e", borderRadius: 20, padding: "2px 10px", fontSize: ".72rem", fontWeight: 700 }}>Pending</span>
                              ) : (
                                <span style={{ background: "#f3f4f6", color: "#9ca3af", borderRadius: 20, padding: "2px 10px", fontSize: ".72rem", fontWeight: 700 }}>Empty</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {globalError && (
                  <div style={{ padding: "12px 16px", borderRadius: 10, marginTop: 16, background: "#fef2f2", color: "#dc2626", fontWeight: 600 }}>
                    ⚠️ {globalError}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                  <button
                    onClick={() => { setStep(4); setSaved(false); }}
                    style={{ padding: "10px 20px", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "none", cursor: "pointer", fontWeight: 600 }}
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      padding: "10px 28px", borderRadius: 10,
                      background: saving ? "#a5b4fc" : "linear-gradient(135deg,#818cf8,#6366f1)",
                      color: "#fff", border: "none", cursor: saving ? "not-allowed" : "pointer",
                      fontWeight: 700, fontSize: ".95rem", boxShadow: "0 2px 10px #6366f140",
                      display: "flex", alignItems: "center", gap: 8
                    }}
                  >
                    {saving ? "Saving…" : "💾 Save Marks"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Navigation */}
        {step < 5 && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24, gap: 10 }}>
            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)}
                style={{ padding: "10px 20px", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "none", cursor: "pointer", fontWeight: 600 }}
              >
                ← Back
              </button>
            )}
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              style={{
                padding: "10px 28px", borderRadius: 10,
                background: canProceed() ? "linear-gradient(135deg,#818cf8,#6366f1)" : "#e5e7eb",
                color: canProceed() ? "#fff" : "#9ca3af",
                border: "none", cursor: canProceed() ? "pointer" : "not-allowed",
                fontWeight: 700, fontSize: ".95rem",
                boxShadow: canProceed() ? "0 2px 10px #6366f140" : "none",
                transition: "all .2s"
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
