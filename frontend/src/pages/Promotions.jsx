import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

const ACTIONS = [
  { value: "promoted", label: "Promote" },
  { value: "repeated", label: "Repeat" },
  { value: "graduated", label: "Graduate" },
  { value: "transferred", label: "Transfer" }
];

const ACTION_BADGE = { promoted: "action-promoted", repeated: "action-repeated", graduated: "action-graduated", transferred: "action-transferred" };

function ConfirmModal({ visible, onClose, onConfirm, summary, executing }) {
  if (!visible) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && !executing && onClose()}>
      <div className="modal modal-sm animate-scale">
        <div className="modal-header">
          <div className="modal-title">Confirm Promotion</div>
          {!executing && <button className="modal-close" onClick={onClose}><svg viewBox="0 0 24 24" fill="none" style={{width:16}}><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button>}
        </div>
        <div className="modal-body">
          <p style={{ color: "var(--text-muted)", marginBottom: 18, fontSize: ".875rem" }}>
            You are about to process promotions for the following students:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Promoted", count: summary.promoted, color: "#10b981", bg: "#d1fae5" },
              { label: "Repeated", count: summary.repeated, color: "#92400e", bg: "#fef3c7" },
              { label: "Graduated", count: summary.graduated, color: "#4f46e5", bg: "#eef2ff" },
              { label: "Transferred", count: summary.transferred, color: "#ef4444", bg: "#fee2e2" },
              { label: "Total", count: summary.promoted + summary.repeated + summary.graduated + summary.transferred, color: "var(--text)", bg: "#f1f5f9" },
            ].map(s => (
              <div key={s.label} style={{ padding: "12px 14px", borderRadius: "var(--radius-sm)", background: s.bg, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: ".8rem", fontWeight: 600, color: s.color }}>{s.label}</span>
                <span style={{ fontSize: "1.2rem", fontWeight: 800, color: s.color }}>{s.count}</span>
              </div>
            ))}
          </div>
          <div className="alert alert-warning" style={{ marginTop: 16 }}>
            ⚠️ This action creates new enrollments and cannot be undone.
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={executing}>Cancel</button>
          <button className="btn btn-primary" onClick={onConfirm} disabled={executing}>
            {executing ? (
              <><svg style={{ width: 15, animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none"><path d="M12 3a9 9 0 1 0 9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>Executing...</>
            ) : "Confirm & Execute"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultModal({ visible, onClose, data }) {
  if (!visible || !data) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-scale">
        <div className="modal-header">
          <div className="modal-title">✅ Promotion Completed</div>
          <button className="modal-close" onClick={onClose}><svg viewBox="0 0 24 24" fill="none" style={{width:16}}><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button>
        </div>
        <div className="modal-body">
          <p style={{ marginBottom: 16, fontSize: ".875rem", color: "var(--text-muted)" }}>
            Promotions from <strong>{data.fromAcademicYear}</strong> → <strong>{data.toAcademicYear}</strong> have been executed.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
            {Object.entries(data.summary).map(([k, v]) => (
              <div key={k} style={{ padding: "10px 12px", borderRadius: "var(--radius-sm)", background: "var(--bg)", textAlign: "center" }}>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text)" }}>{v}</div>
                <div style={{ fontSize: ".7rem", color: "var(--text-muted)", textTransform: "capitalize", fontWeight: 600 }}>{k}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function Promotions() {
  const [years, setYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

  const [form, setForm] = useState({
    fromAcademicYearId: "",
    toAcademicYearId: "",
    fromClassLevelId: "",
    sectionId: ""
  });

  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [executeLoading, setExecuteLoading] = useState(false);
  const [error, setError] = useState("");

  const [preview, setPreview] = useState(null);
  const [decisions, setDecisions] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [resultData, setResultData] = useState(null);

  const fromSections = useMemo(() => {
    if (!form.fromClassLevelId) return [];
    return sections.filter((s) => (s.classLevelId?._id || s.classLevelId) === form.fromClassLevelId);
  }, [sections, form.fromClassLevelId]);

  const sectionsByClass = useMemo(() => {
    const m = new Map();
    for (const s of sections) {
      const classId = s.classLevelId?._id || s.classLevelId;
      if (!m.has(classId)) m.set(classId, []);
      m.get(classId).push(s);
    }
    return m;
  }, [sections]);

  async function loadInit() {
    setError(""); setLoading(true);
    try {
      const [yRes, cRes, sRes] = await Promise.all([
        api.get("/api/academic-years"),
        api.get("/api/classes"),
        api.get("/api/sections")
      ]);
      const yrs = yRes.data || []; const cls = cRes.data || []; const secs = sRes.data || [];
      setYears(yrs); setClasses(cls); setSections(secs);
      const activeYear = yrs.find((x) => x.status === "active") || yrs[0];
      const otherYear = yrs.find((x) => x._id !== activeYear?._id) || yrs[0];
      const firstClass = cls[0];
      const secsForClass = secs.filter((s) => (s.classLevelId?._id || s.classLevelId) === firstClass?._id);
      setForm({ fromAcademicYearId: activeYear?._id || "", toAcademicYearId: otherYear?._id || "", fromClassLevelId: firstClass?._id || "", sectionId: secsForClass[0]?._id || "" });
    } catch (err) { setError(err?.response?.data?.message || "Failed to load"); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadInit(); }, []);

  function setField(name, value) {
    const next = { ...form, [name]: value };
    if (name === "fromClassLevelId") {
      const secsForClass = sections.filter((s) => (s.classLevelId?._id || s.classLevelId) === value);
      next.sectionId = secsForClass[0]?._id || "";
    }
    setForm(next);
  }

  function initDecisions(enrollments) {
    const obj = {};
    for (const e of enrollments) {
      const currentOrder = e.classLevelId?.orderNumber;
      let defaultAction = "promoted";
      const nextClass = classes.find((c) => c.orderNumber === currentOrder + 1);
      if (!nextClass) defaultAction = "repeated";
      const chosenClass = defaultAction === "promoted" ? nextClass : e.classLevelId;
      const toClassId = chosenClass?._id || "";
      const possibleSections = sectionsByClass.get(toClassId) || [];
      const sameName = possibleSections.find((s) => s.name === e.sectionId?.name);
      const toSectionId = (sameName || possibleSections[0])?._id || "";
      obj[e._id] = { studentId: e.studentId?._id || e.studentId, action: defaultAction, toClassLevelId: toClassId, toSectionId, reason: "" };
    }
    setDecisions(obj);
  }

  async function previewNow() {
    setError(""); setPreviewLoading(true); setPreview(null); setDecisions({});
    try {
      const { data } = await api.post("/api/promotions/preview", {
        fromAcademicYearId: form.fromAcademicYearId,
        toAcademicYearId: form.toAcademicYearId,
        fromClassLevelId: form.fromClassLevelId,
        sectionId: form.sectionId || undefined
      });
      setPreview(data);
      initDecisions(data.enrollments || []);
    } catch (err) { setError(err?.response?.data?.message || "Preview failed"); }
    finally { setPreviewLoading(false); }
  }

  function updateDecision(enrollmentId, patch) {
    setDecisions((prev) => ({ ...prev, [enrollmentId]: { ...prev[enrollmentId], ...patch } }));
  }

  function bulkSet(action) {
    if (!preview?.enrollments?.length) return;
    const next = { ...decisions };
    for (const e of preview.enrollments) {
      next[e._id] = { ...next[e._id], action };
      if (action === "graduated" || action === "transferred") { next[e._id].toClassLevelId = ""; next[e._id].toSectionId = ""; }
      else { if (!next[e._id].toClassLevelId) next[e._id].toClassLevelId = e.classLevelId?._id; if (!next[e._id].toSectionId) next[e._id].toSectionId = e.sectionId?._id; }
    }
    setDecisions(next);
  }

  const decisionsSummary = useMemo(() => {
    const s = { promoted: 0, repeated: 0, graduated: 0, transferred: 0 };
    for (const d of Object.values(decisions)) { if (s[d.action] !== undefined) s[d.action]++; }
    return s;
  }, [decisions]);

  function openConfirm() {
    setError("");
    if (!preview?.enrollments?.length) { setError("Preview students first"); return; }
    const decisionsArr = preview.enrollments.map((e) => decisions[e._id]).filter(Boolean);
    for (const d of decisionsArr) {
      if ((d.action === "promoted" || d.action === "repeated") && (!d.toClassLevelId || !d.toSectionId)) {
        setError("All promoted/repeated students must have target class & section"); return;
      }
    }
    setShowConfirm(true);
  }

  async function executeNow() {
    setExecuteLoading(true);
    try {
      const decisionsArr = preview.enrollments.map((e) => decisions[e._id]).filter(Boolean);
      const { data } = await api.post("/api/promotions/execute", {
        fromAcademicYearId: form.fromAcademicYearId,
        toAcademicYearId: form.toAcademicYearId,
        decisions: decisionsArr
      });
      setShowConfirm(false);
      setResultData(data);
      setPreview(null);
      setDecisions({});
    } catch (err) { setError(err?.response?.data?.message || "Execute failed"); setShowConfirm(false); }
    finally { setExecuteLoading(false); }
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      <div className="page-header">
        <h1>Student Promotions</h1>
        <p>Preview enrolled students and promote, repeat, graduate, or transfer them to the next academic year.</p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div className="card"><div className="card-body" style={{ color: "var(--text-muted)" }}>Loading...</div></div>
      ) : (
        <>
          {/* Filters */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><div className="card-title">Promotion Setup</div></div>
            <div className="card-body">
              <div className="form-grid form-grid-4" style={{ gap: 12 }}>
                <div className="form-group"><label className="form-label">From Academic Year</label>
                  <select className="form-select" value={form.fromAcademicYearId} onChange={(e) => setField("fromAcademicYearId", e.target.value)}>
                    {years.map((y) => <option key={y._id} value={y._id}>{y.name} {y.status === "active" ? "(active)" : ""}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">To Academic Year</label>
                  <select className="form-select" value={form.toAcademicYearId} onChange={(e) => setField("toAcademicYearId", e.target.value)}>
                    {years.map((y) => <option key={y._id} value={y._id}>{y.name} {y.status === "active" ? "(active)" : ""}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">From Class</label>
                  <select className="form-select" value={form.fromClassLevelId} onChange={(e) => setField("fromClassLevelId", e.target.value)}>
                    {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">From Section (optional)</label>
                  <select className="form-select" value={form.sectionId} onChange={(e) => setField("sectionId", e.target.value)}>
                    <option value="">All Sections</option>
                    {fromSections.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {ACTIONS.map(a => (
                    <button key={a.value} className="btn btn-secondary btn-sm" onClick={() => bulkSet(a.value)}>
                      {a.label} all
                    </button>
                  ))}
                </div>
                <button onClick={previewNow} disabled={previewLoading} className="btn btn-primary">
                  {previewLoading ? "Previewing..." : "Preview Students"}
                </button>
              </div>
            </div>
          </div>

          {/* Preview Table */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Preview</div>
                {preview && (
                  <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                    {Object.entries(decisionsSummary).map(([k, v]) => (
                      <span key={k} className={`badge ${ACTION_BADGE[k] || "badge-gray"}`}>{k}: {v}</span>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={openConfirm} disabled={!preview?.enrollments?.length} className="btn btn-success">
                <svg viewBox="0 0 24 24" fill="none" style={{ width: 15 }}><path d="m9 12 2 2 4-4M3 12a9 9 0 1 0 18 0A9 9 0 0 0 3 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                Execute Promotion
              </button>
            </div>

            <div className="card-body" style={{ padding: 0 }}>
              {!preview ? (
                <div className="empty-state">
                  <svg viewBox="0 0 24 24" fill="none"><path d="m6.5 17.5 1.5-1.5L11 19V9h2v10l3-3 1.5 1.5L12 22l-5.5-4.5Z" stroke="currentColor" strokeWidth="2"/></svg>
                  <h3>No preview yet</h3><p>Click "Preview Students" to load the list.</p>
                </div>
              ) : preview.count === 0 ? (
                <div className="empty-state"><h3>No students found</h3><p>No active enrollments in the selected class/section.</p></div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead><tr>
                      <th>Student</th><th>Current</th><th>Action</th><th>Target Class</th><th>Target Section</th><th>Reason</th>
                    </tr></thead>
                    <tbody>
                      {preview.enrollments.map((e) => {
                        const d = decisions[e._id];
                        const needsTarget = d?.action === "promoted" || d?.action === "repeated";
                        const targetSections = sectionsByClass.get(d?.toClassLevelId) || [];
                        return (
                          <tr key={e._id}>
                            <td style={{ fontWeight: 600 }}>{e.studentId?.firstName} {e.studentId?.lastName}</td>
                            <td><span className="badge badge-blue">{e.classLevelId?.name} - {e.sectionId?.name}</span></td>
                            <td>
                              <select className="form-select" style={{ minWidth: 110 }} value={d?.action || "promoted"} onChange={(ev) => {
                                const action = ev.target.value;
                                updateDecision(e._id, { action, ...(action === "graduated" || action === "transferred" ? { toClassLevelId: "", toSectionId: "" } : {}) });
                              }}>
                                {ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                              </select>
                            </td>
                            <td>
                              <select disabled={!needsTarget} className="form-select" style={{ minWidth: 120 }} value={d?.toClassLevelId || ""} onChange={(ev) => {
                                const toClassLevelId = ev.target.value;
                                const possible = sectionsByClass.get(toClassLevelId) || [];
                                updateDecision(e._id, { toClassLevelId, toSectionId: possible[0]?._id || "" });
                              }}>
                                <option value="">—</option>
                                {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                              </select>
                            </td>
                            <td>
                              <select disabled={!needsTarget} className="form-select" style={{ minWidth: 100 }} value={d?.toSectionId || ""} onChange={(ev) => updateDecision(e._id, { toSectionId: ev.target.value })}>
                                <option value="">—</option>
                                {targetSections.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                              </select>
                            </td>
                            <td><input className="form-input" style={{ minWidth: 130 }} value={d?.reason || ""} onChange={(ev) => updateDecision(e._id, { reason: ev.target.value })} placeholder="Optional note" /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <ConfirmModal
        visible={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={executeNow}
        summary={decisionsSummary}
        executing={executeLoading}
      />
      <ResultModal
        visible={!!resultData}
        onClose={() => setResultData(null)}
        data={resultData}
      />
    </div>
  );
}