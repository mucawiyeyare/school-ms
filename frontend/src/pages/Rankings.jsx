import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { auth } from "../lib/auth";

const MEDAL = { 1: "🥇", 2: "🥈", 3: "🥉" };

function PositionBadge({ pos }) {
  if (pos <= 3) {
    return (
      <span style={{ fontSize: "1.4rem" }}>{MEDAL[pos]}</span>
    );
  }
  return (
    <span style={{
      background: "#f3f4f6", color: "#374151",
      borderRadius: 8, padding: "3px 12px", fontWeight: 700, fontSize: ".9rem"
    }}>#{pos}</span>
  );
}

function ScoreBar({ value, max }) {
  const pct = max ? Math.min((value / max) * 100, 100) : 0;
  const color = pct >= 75 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: "#e5e7eb", borderRadius: 10 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 10, transition: "width .4s" }} />
      </div>
      <span style={{ fontSize: ".78rem", fontWeight: 700, color, minWidth: 36, textAlign: "right" }}>
        {Math.round(pct)}%
      </span>
    </div>
  );
}

export default function Rankings() {
  const user = auth.getUser();
  const isAdmin = user?.role === "Admin";

  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses]             = useState([]);
  const [sections, setSections]           = useState([]);
  const [rankings, setRankings]           = useState([]);
  const [subjectTotals, setSubjectTotals] = useState([]);
  const [examTypes, setExamTypes]         = useState([]);

  const [selYear, setSelYear]       = useState("");
  const [selClass, setSelClass]     = useState("");
  const [selSection, setSelSection] = useState("");

  const [loadingRanks, setLoadingRanks] = useState(false);
  const [generating, setGenerating]     = useState(false);
  const [error, setError]               = useState("");
  const [success, setSuccess]           = useState("");
  const [activeTab, setActiveTab]       = useState("rankings"); // rankings | subjects

  // Load initial data
  useEffect(() => {
    Promise.all([
      api.get("/api/academic-years"),
      api.get("/api/classes"),
      api.get("/api/marks/exam-types")
    ]).then(([yr, cls, et]) => {
      setAcademicYears(yr.data || []);
      setClasses(cls.data || []);
      setExamTypes((et.data || []).filter(e => e.isEnabled));
      const active = (yr.data || []).find(y => y.status === "active");
      if (active) setSelYear(active._id);
    }).catch(() => setError("Failed to load data"));
  }, []);

  // Load sections when class changes
  useEffect(() => {
    if (!selClass) { setSections([]); setSelSection(""); return; }
    api.get(`/api/sections?classLevelId=${selClass}`)
      .then(r => setSections(r.data || []))
      .catch(() => setSections([]));
    setSelSection("");
    setRankings([]);
  }, [selClass]);

  const loadRankings = useCallback(async () => {
    if (!selYear || !selClass || !selSection) return;
    setLoadingRanks(true);
    setError("");
    try {
      const [rRes, sRes] = await Promise.all([
        api.get(`/api/marks/rankings?academicYearId=${selYear}&classLevelId=${selClass}&sectionId=${selSection}`),
        api.get(`/api/marks/subject-totals?academicYearId=${selYear}&classLevelId=${selClass}&sectionId=${selSection}`)
      ]);
      setRankings(rRes.data || []);
      setSubjectTotals(sRes.data || []);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load rankings");
    } finally {
      setLoadingRanks(false);
    }
  }, [selYear, selClass, selSection]);

  useEffect(() => {
    loadRankings();
    setSuccess("");
  }, [loadRankings]);

  async function handleGenerate() {
    if (!selYear || !selClass || !selSection) return;
    setGenerating(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.post("/api/marks/generate-rankings", {
        academicYearId: selYear,
        classLevelId:   selClass,
        sectionId:      selSection
      });
      setSuccess(`✅ Rankings generated for ${res.data.rankings?.length || 0} students.`);
      await loadRankings();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to generate rankings");
    } finally {
      setGenerating(false);
    }
  }

  const selectedYearObj   = academicYears.find(y => y._id === selYear);
  const selectedClassObj  = classes.find(c => c._id === selClass);
  const selectedSection   = sections.find(s => s._id === selSection);

  // Determine max score from subject totals
  const maxSubjects = subjectTotals.length > 0
    ? Math.max(...subjectTotals.map(s => s.subjectTotals?.length || 0))
    : 0;
  const maxPossibleTotal = maxSubjects * 100;

  // Merge subject totals data into rankings by studentId
  const mergedRankings = rankings.map(r => {
    const sid = String(r.studentId?._id || r.studentId);
    const totData = subjectTotals.find(s => String(s.student?._id || s.student) === sid);
    return { ...r, subjectData: totData };
  });

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 0 40px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>Rankings &amp; Positions</h1>
        <p style={{ color: "var(--text-2,#6b7280)", fontSize: ".9rem", margin: "4px 0 0" }}>
          End-of-year student rankings by class &amp; section.
        </p>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: 20, marginBottom: 24, borderRadius: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16, alignItems: "end" }}>
          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 6, fontSize: ".85rem" }}>Academic Year</label>
            <select value={selYear} onChange={e => setSelYear(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: ".9rem" }}>
              <option value="">-- Select --</option>
              {academicYears.map(y => <option key={y._id} value={y._id}>{y.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 6, fontSize: ".85rem" }}>Class</label>
            <select value={selClass} onChange={e => setSelClass(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: ".9rem" }}>
              <option value="">-- Select --</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 6, fontSize: ".85rem" }}>Section</label>
            <select value={selSection} onChange={e => setSelSection(e.target.value)} disabled={!selClass}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: ".9rem", opacity: selClass ? 1 : .5 }}>
              <option value="">-- Select --</option>
              {sections.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          {isAdmin && (
            <button
              onClick={handleGenerate}
              disabled={!selYear || !selClass || !selSection || generating}
              style={{
                padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontWeight: 700,
                background: (!selYear || !selClass || !selSection || generating) ? "#e5e7eb" : "linear-gradient(135deg,#818cf8,#6366f1)",
                color: (!selYear || !selClass || !selSection || generating) ? "#9ca3af" : "#fff",
                border: "none", boxShadow: "0 2px 10px #6366f130", fontSize: ".9rem",
                marginTop: 24
              }}
            >
              {generating ? "⏳ Generating…" : "⚡ Generate Rankings"}
            </button>
          )}
        </div>

        {success && <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "#d1fae5", color: "#065f46", fontWeight: 600 }}>{success}</div>}
        {error && <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "#fef2f2", color: "#dc2626", fontWeight: 600 }}>⚠️ {error}</div>}
      </div>

      {/* Summary Stats */}
      {rankings.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Total Students", value: rankings.length, icon: "👥", color: "#6366f1" },
            { label: "Highest Score", value: Math.max(...rankings.map(r => r.totalScore)), icon: "🏆", color: "#10b981" },
            { label: "Lowest Score",  value: Math.min(...rankings.map(r => r.totalScore)), icon: "📉", color: "#f59e0b" },
            {
              label: "Class Average",
              value: (rankings.reduce((s, r) => s + r.totalScore, 0) / rankings.length).toFixed(1),
              icon: "📊", color: "#3b82f6"
            },
          ].map(stat => (
            <div key={stat.label} className="card" style={{ padding: "16px 20px", borderRadius: 12, borderLeft: `4px solid ${stat.color}` }}>
              <div style={{ fontSize: "1.6rem" }}>{stat.icon}</div>
              <div style={{ fontWeight: 800, fontSize: "1.4rem", color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: ".78rem", color: "#6b7280", fontWeight: 600 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      {rankings.length > 0 && (
        <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "2px solid #e5e7eb" }}>
          {["rankings", "subjects"].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              padding: "10px 20px", border: "none", background: "none", cursor: "pointer",
              fontWeight: 700, fontSize: ".9rem",
              color: activeTab === t ? "#6366f1" : "#9ca3af",
              borderBottom: `3px solid ${activeTab === t ? "#6366f1" : "transparent"}`,
              marginBottom: -2, transition: "all .2s"
            }}>
              {t === "rankings" ? "🏆 Rankings" : "📚 Subject Breakdown"}
            </button>
          ))}
        </div>
      )}

      {/* Rankings Table */}
      {activeTab === "rankings" && (
        <div className="card" style={{ borderRadius: 16, overflow: "hidden" }}>
          {loadingRanks ? (
            <div style={{ padding: 60, textAlign: "center", color: "#9ca3af" }}>
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>⏳</div>
              Loading rankings…
            </div>
          ) : !selYear || !selClass || !selSection ? (
            <div style={{ padding: 60, textAlign: "center", color: "#9ca3af" }}>
              <div style={{ fontSize: "3rem", marginBottom: 12 }}>🏫</div>
              Select Academic Year, Class and Section to view rankings.
            </div>
          ) : rankings.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: "#9ca3af" }}>
              <div style={{ fontSize: "3rem", marginBottom: 12 }}>📋</div>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>No rankings generated yet</div>
              {isAdmin && <div style={{ fontSize: ".85rem" }}>Click "Generate Rankings" to compute positions.</div>}
            </div>
          ) : (
            <div className="table-wrap">
              <table style={{ minWidth: 700, width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "linear-gradient(135deg,#818cf8,#6366f1)", color: "#fff" }}>
                    <th style={{ padding: "14px 16px", textAlign: "center", fontWeight: 700, fontSize: ".82rem" }}>Position</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 700, fontSize: ".82rem" }}>Student</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 700, fontSize: ".82rem" }}>EMIS No.</th>
                    <th style={{ padding: "14px 16px", textAlign: "right", fontWeight: 700, fontSize: ".82rem" }}>Total Score</th>
                    <th style={{ padding: "14px 16px", textAlign: "right", fontWeight: 700, fontSize: ".82rem" }}>Average</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 700, fontSize: ".82rem", width: 180 }}>Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {mergedRankings.map((r, idx) => {
                    const isTop3 = r.position <= 3;
                    return (
                      <tr
                        key={r._id || idx}
                        style={{
                          borderBottom: "1px solid #f3f4f6",
                          background: isTop3 ? (r.position === 1 ? "#fffbeb" : r.position === 2 ? "#f9fafb" : "#fff7ed") : "transparent",
                          transition: "background .15s"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                        onMouseLeave={e => e.currentTarget.style.background = isTop3 ? (r.position === 1 ? "#fffbeb" : r.position === 2 ? "#f9fafb" : "#fff7ed") : "transparent"}
                      >
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          <PositionBadge pos={r.position} />
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontWeight: 700 }}>
                            {r.studentId?.firstName} {r.studentId?.lastName}
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: ".84rem" }}>
                          {r.studentId?.emisNumber || "—"}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 800, fontSize: "1.05rem", color: "#374151" }}>
                          {r.totalScore}
                          {maxPossibleTotal > 0 && (
                            <span style={{ fontWeight: 400, fontSize: ".78rem", color: "#9ca3af" }}>/{maxPossibleTotal}</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "#6366f1" }}>
                          {r.averageScore?.toFixed(1)}%
                        </td>
                        <td style={{ padding: "12px 16px", minWidth: 140 }}>
                          <ScoreBar value={r.totalScore} max={maxPossibleTotal || 100} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* Footer info */}
              <div style={{ padding: "12px 16px", background: "#f9fafb", borderTop: "1px solid #e5e7eb", fontSize: ".78rem", color: "#9ca3af", display: "flex", justifyContent: "space-between" }}>
                <span>
                  {selectedYearObj?.name} · {selectedClassObj?.name} {selectedSection?.name}
                </span>
                <span>
                  Ties broken by: Final total → Midterm total → Name (A–Z)
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subject Breakdown Table */}
      {activeTab === "subjects" && (
        <div className="card" style={{ borderRadius: 16, overflow: "hidden" }}>
          {subjectTotals.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: "#9ca3af" }}>No data available.</div>
          ) : (
            <div className="table-wrap">
              <table style={{ minWidth: 700, width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "linear-gradient(135deg,#818cf8,#6366f1)", color: "#fff" }}>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 700, fontSize: ".82rem" }}>Student</th>
                    {subjectTotals[0]?.subjectTotals?.map(st => (
                      <th key={st.subject?._id} style={{ padding: "14px 12px", textAlign: "center", fontWeight: 700, fontSize: ".78rem", whiteSpace: "nowrap" }}>
                        {st.subject?.name}
                      </th>
                    ))}
                    {examTypes.map(et => (
                      <th key={et.code} style={{ padding: "14px 10px", textAlign: "center", fontWeight: 700, fontSize: ".75rem", whiteSpace: "nowrap", opacity: .85 }}>
                        {et.label}<br /><span style={{ fontWeight: 400 }}>/{et.maxMarks}</span>
                      </th>
                    ))}
                    <th style={{ padding: "14px 16px", textAlign: "right", fontWeight: 700, fontSize: ".82rem" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectTotals.map((row, idx) => {
                    const sid = String(row.student?._id || row.student);
                    const rankEntry = rankings.find(r => String(r.studentId?._id || r.studentId) === sid);
                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                        onMouseLeave={e => e.currentTarget.style.background = ""}>
                        <td style={{ padding: "10px 16px" }}>
                          <div style={{ fontWeight: 700 }}>{row.student?.firstName} {row.student?.lastName}</div>
                          {rankEntry && (
                            <div style={{ fontSize: ".72rem", color: "#6b7280" }}>
                              {MEDAL[rankEntry.position] || `#${rankEntry.position}`} Position {rankEntry.position}
                            </div>
                          )}
                        </td>
                        {row.subjectTotals?.map(st => (
                          <td key={st.subject?._id} style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700 }}>
                            <span style={{
                              color: st.total >= 80 ? "#10b981" : st.total >= 50 ? "#f59e0b" : "#ef4444"
                            }}>
                              {st.total}
                            </span>
                            {!st.isComplete && <span title="Some marks missing" style={{ fontSize: ".65rem", color: "#9ca3af", marginLeft: 2 }}>⚠️</span>}
                          </td>
                        ))}
                        {examTypes.map(et => {
                          const total = row.subjectTotals?.reduce((s, st) => s + (st.marks?.[et.code] ?? 0), 0);
                          return (
                            <td key={et.code} style={{ padding: "10px 10px", textAlign: "center", color: "#6b7280", fontSize: ".84rem" }}>
                              {total}
                            </td>
                          );
                        })}
                        <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 800, fontSize: "1.05rem", color: "#6366f1" }}>
                          {row.overallTotal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
