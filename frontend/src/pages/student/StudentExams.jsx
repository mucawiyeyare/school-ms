import { useEffect, useState, useMemo } from "react";
import { api } from "../../lib/api";

// ── helpers ────────────────────────────────────────────────────────────────────
const EXAM_ORDER  = ["monthly1", "midterm", "monthly2", "final"];
const EXAM_HEADS  = { monthly1: "Monthly 1", midterm: "Mid-Term", monthly2: "Monthly 2", final: "Final" };
const EXAM_COLORS = { monthly1: "#0ea5e9", midterm: "#f59e0b", monthly2: "#22c55e", final: "#8b5cf6" };

function calcGrade(pct) {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 75) return "B+";
  if (pct >= 70) return "B";
  if (pct >= 65) return "C+";
  if (pct >= 60) return "C";
  if (pct >= 55) return "D+";
  if (pct >= 50) return "D";
  return "F";
}

function gradeColor(g) {
  if (g === "A+" || g === "A") return { bg: "#dcfce7", color: "#166534" };
  if (g === "B+" || g === "B") return { bg: "#dbeafe", color: "#1e40af" };
  if (g === "C+" || g === "C") return { bg: "#fef3c7", color: "#92400e" };
  if (g === "D+" || g === "D") return { bg: "#fed7aa", color: "#c2410c" };
  return { bg: "#fee2e2", color: "#991b1b" };
}

function ordinal(n) {
  if (!n) return "—";
  const s = ["th","st","nd","rd"], v = n % 100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
}

// ── PrintButton ────────────────────────────────────────────────────────────────
function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        padding: "9px 18px", borderRadius: 8,
        background: "linear-gradient(135deg,#10b981,#059669)",
        color: "#fff", border: "none", cursor: "pointer",
        fontWeight: 700, fontSize: ".82rem",
        boxShadow: "0 4px 12px rgba(16,185,129,.3)"
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" style={{ width: 15 }}>
        <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6v-8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      Print Result
    </button>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function StudentExams() {
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [selectedKey, setSelectedKey] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/students/me/results");
        setData(res.data);
        if (res.data?.groups?.length > 0) {
          const g = res.data.groups[0];
          setSelectedKey(`${g.classLevelId}__${g.academicYearId}`);
        }
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to load results.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const groups = data?.groups || [];

  const selectedGroup = useMemo(() => {
    if (!selectedKey) return null;
    return groups.find(g => `${g.classLevelId}__${g.academicYearId}` === selectedKey) || null;
  }, [groups, selectedKey]);

  const isCurrent = (g) =>
    g.classLevelId === String(data?.student?.currentClass?._id || data?.student?.currentClass);

  // ── What's available from examTypes in the group ──────────────────────────
  const examTypes    = selectedGroup?.examTypes || [];
  const enabledCodes = EXAM_ORDER.filter(c => examTypes.find(e => e.code === c && e.isEnabled !== false));
  const maxByCode    = Object.fromEntries(examTypes.map(e => [e.code, e.maxMarks || 30]));
  const grandMax     = enabledCodes.reduce((s, c) => s + (maxByCode[c] || 30), 0);

  // ── Table rows ──────────────────────────────────────────────────────────────
  const rows = useMemo(() => {
    if (!selectedGroup) return [];
    return (selectedGroup.subjects || []).map(sub => {
      const marks = sub.examMarks || {};
      const total = enabledCodes.reduce((s, c) => s + (marks[c] ?? 0), 0);
      const pct   = grandMax > 0 ? (total / grandMax) * 100 : 0;
      const grade = calcGrade(pct);
      return { ...sub, marks, total, pct, grade };
    });
  }, [selectedGroup, enabledCodes, grandMax]);

  // ── Summary ─────────────────────────────────────────────────────────────────
  const totalObtained = rows.reduce((s, r) => s + r.total, 0);
  const passed        = rows.filter(r => r.pct >= 50).length;
  const ovPct         = rows.length > 0 ? totalObtained / (rows.length * grandMax) * 100 : 0;
  const ovGrade       = calcGrade(ovPct);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, flexDirection: "column", gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid #6366f1", borderTopColor: "transparent", animation: "spin .7s linear infinite" }} />
      <div style={{ color: "#64748b", fontSize: ".88rem" }}>Loading your results…</div>
    </div>
  );

  if (error) return (
    <div style={{ padding: 48, textAlign: "center" }}>
      <div style={{ color: "#ef4444", fontWeight: 700 }}>⚠️ {error}</div>
    </div>
  );

  return (
    <div>
      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "1.4rem" }}>📋</span> Exam Results
          </h1>
          <p>Your complete subject marks across all exam types for the selected class.</p>
        </div>
        <PrintButton />
      </div>

      {/* ── Class selector bar ── */}
      <div style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #4f46e5 100%)",
        borderRadius: 14, padding: "16px 22px", marginBottom: 24,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 14,
        boxShadow: "0 8px 24px rgba(37,99,235,.35)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Class dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label style={{ color: "rgba(255,255,255,.85)", fontWeight: 600, fontSize: ".82rem", whiteSpace: "nowrap" }}>
              Select Class:
            </label>
            <select
              value={selectedKey || ""}
              onChange={e => setSelectedKey(e.target.value)}
              style={{
                padding: "9px 36px 9px 14px",
                borderRadius: 8, border: "1.5px solid rgba(255,255,255,.3)",
                background: "rgba(255,255,255,.15)", color: "#fff",
                fontWeight: 700, fontSize: ".88rem", cursor: "pointer",
                outline: "none", backdropFilter: "blur(4px)",
                appearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M6 9l6 6 6-6' stroke='white' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 10px center",
                backgroundSize: "16px"
              }}
            >
              {groups.length === 0 && <option value="">No results available</option>}
              {groups.map(g => {
                const key = `${g.classLevelId}__${g.academicYearId}`;
                return (
                  <option key={key} value={key} style={{ background: "#1e3a8a", color: "#fff" }}>
                    {g.className} — {g.academicYearName}{g.sectionName ? ` (Sec ${g.sectionName})` : ""}
                    {isCurrent(g) ? " ★ Current" : ""}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Right: position + score badges */}
        {selectedGroup && (
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            {selectedGroup.position !== undefined && (
              <div style={{
                padding: "7px 16px", borderRadius: 8,
                background: "rgba(255,255,255,.18)",
                border: "1px solid rgba(255,255,255,.28)",
                textAlign: "center"
              }}>
                <div style={{ fontWeight: 900, fontSize: "1.1rem", color: "#fbbf24" }}>
                  🏅 {ordinal(selectedGroup.position)}
                </div>
                <div style={{ fontSize: ".65rem", color: "rgba(255,255,255,.7)" }}>Class Position</div>
              </div>
            )}
            {selectedGroup.totalScore !== undefined && (
              <div style={{
                padding: "7px 16px", borderRadius: 8,
                background: "rgba(255,255,255,.12)",
                border: "1px solid rgba(255,255,255,.2)",
                textAlign: "center"
              }}>
                <div style={{ fontWeight: 900, fontSize: "1.1rem", color: "#fff" }}>
                  {selectedGroup.totalScore}
                </div>
                <div style={{ fontSize: ".65rem", color: "rgba(255,255,255,.7)" }}>Total Score</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Student info card ── */}
      {selectedGroup && data?.student && (
        <div style={{
          background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0",
          padding: "16px 22px", marginBottom: 20,
          display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 32, rowGap: 4 }}>
            <span style={{ fontSize: ".78rem", color: "#94a3b8", fontWeight: 600 }}>Student's Name</span>
            <span style={{ fontSize: ".85rem", fontWeight: 700, color: "#1e293b" }}>
              {data.student.firstName} {data.student.lastName}
            </span>
            <span style={{ fontSize: ".78rem", color: "#94a3b8", fontWeight: 600 }}>EMIS Number</span>
            <span style={{ fontSize: ".85rem", fontWeight: 700, color: "#1e293b", fontFamily: "monospace" }}>
              {data.student.emisNumber || "—"}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 32, rowGap: 4 }}>
            <span style={{ fontSize: ".78rem", color: "#94a3b8", fontWeight: 600 }}>Class</span>
            <span style={{ fontSize: ".85rem", fontWeight: 700, color: "#1e293b" }}>
              {selectedGroup.className}
              {selectedGroup.sectionName && ` — Section ${selectedGroup.sectionName}`}
            </span>
            <span style={{ fontSize: ".78rem", color: "#94a3b8", fontWeight: 600 }}>Academic Year</span>
            <span style={{ fontSize: ".85rem", fontWeight: 700, color: "#1e293b" }}>{selectedGroup.academicYearName}</span>
          </div>
        </div>
      )}

      {/* ── Results table ── */}
      {!selectedGroup || rows.length === 0 ? (
        <div className="card">
          <div className="empty-state" style={{ padding: "52px 24px" }}>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <h3>No results available</h3>
            <p>Results for this class haven't been published yet.</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          {/* Table header bar */}
          <div style={{
            background: "linear-gradient(135deg,#0f172a,#1e293b)",
            padding: "14px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between"
          }}>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: ".95rem" }}>
              📊 {selectedGroup.className} — {selectedGroup.academicYearName}
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              <span style={{ fontSize: ".75rem", color: "rgba(255,255,255,.65)" }}>{rows.length} subjects</span>
              <span style={{ fontSize: ".75rem", color: "#4ade80" }}>{passed} passed</span>
              <span style={{ fontSize: ".75rem", color: "#f87171" }}>{rows.length - passed} failed</span>
            </div>
          </div>

          <div className="table-wrap">
            <table style={{ minWidth: 700 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ padding: "11px 14px", textAlign: "left", fontWeight: 700, color: "#475569", fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".05em", borderBottom: "2px solid #e2e8f0" }}>
                    Code
                  </th>
                  <th style={{ padding: "11px 14px", textAlign: "left", fontWeight: 700, color: "#475569", fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".05em", borderBottom: "2px solid #e2e8f0" }}>
                    Subject Name
                  </th>
                  {enabledCodes.map(code => (
                    <th key={code} style={{
                      padding: "11px 10px", textAlign: "center",
                      fontWeight: 700, fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".05em",
                      color: EXAM_COLORS[code], borderBottom: "2px solid #e2e8f0",
                      whiteSpace: "nowrap"
                    }}>
                      {EXAM_HEADS[code]}
                      <div style={{ fontSize: ".6rem", fontWeight: 500, color: "#94a3b8", marginTop: 1 }}>
                        /{maxByCode[code] || 30}
                      </div>
                    </th>
                  ))}
                  <th style={{ padding: "11px 10px", textAlign: "center", fontWeight: 700, color: "#1e293b", fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".05em", borderBottom: "2px solid #e2e8f0", whiteSpace: "nowrap" }}>
                    Total
                    <div style={{ fontSize: ".6rem", fontWeight: 500, color: "#94a3b8", marginTop: 1 }}>/{grandMax}</div>
                  </th>
                  <th style={{ padding: "11px 10px", textAlign: "center", fontWeight: 700, color: "#475569", fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".05em", borderBottom: "2px solid #e2e8f0" }}>
                    Grade
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const { bg, color } = gradeColor(row.grade);
                  const passing = row.pct >= 50;
                  return (
                    <tr
                      key={row.subjectId || i}
                      style={{
                        background: i % 2 === 0 ? "#fff" : "#fafbfc",
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background .12s"
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f0f9ff"}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafbfc"}
                    >
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{
                          fontFamily: "monospace", fontSize: ".78rem", fontWeight: 700,
                          background: "#e0f2fe", color: "#0369a1",
                          borderRadius: 6, padding: "3px 8px"
                        }}>
                          {row.code || "—"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", fontWeight: 600, color: "#1e293b", fontSize: ".88rem" }}>
                        {row.name}
                      </td>
                      {enabledCodes.map(code => {
                        const m = row.marks[code];
                        const max = maxByCode[code] || 30;
                        const subPct = max > 0 && m !== undefined ? (m / max) * 100 : null;
                        return (
                          <td key={code} style={{ padding: "12px 10px", textAlign: "center" }}>
                            {m !== undefined ? (
                              <div>
                                <div style={{ fontWeight: 800, fontSize: ".95rem", color: subPct !== null && subPct >= 50 ? "#1e293b" : "#ef4444" }}>
                                  {m}
                                </div>
                                {subPct !== null && (
                                  <div style={{ fontSize: ".62rem", color: "#94a3b8", marginTop: 1 }}>{subPct.toFixed(0)}%</div>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: "#cbd5e1", fontSize: ".78rem" }}>—</span>
                            )}
                          </td>
                        );
                      })}
                      <td style={{ padding: "12px 10px", textAlign: "center" }}>
                        <div style={{ fontWeight: 900, fontSize: "1rem", color: passing ? "#1e293b" : "#ef4444" }}>{row.total}</div>
                        <div style={{ fontSize: ".64rem", color: passing ? "#10b981" : "#ef4444", fontWeight: 600 }}>{row.pct.toFixed(1)}%</div>
                      </td>
                      <td style={{ padding: "12px 10px", textAlign: "center" }}>
                        {(() => {
                          const { bg, color } = gradeColor(row.grade);
                          return (
                            <span style={{
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              minWidth: 38, padding: "4px 10px", borderRadius: 999,
                              background: bg, color, fontWeight: 800, fontSize: ".82rem",
                              border: `1px solid ${color}30`
                            }}>
                              {row.grade}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Summary footer row */}
              <tfoot>
                <tr style={{ background: "linear-gradient(135deg,#f8fafc,#f1f5f9)", borderTop: "2px solid #e2e8f0" }}>
                  <td colSpan={2} style={{ padding: "12px 14px", fontWeight: 800, fontSize: ".85rem", color: "#1e293b" }}>
                    Overall Summary
                  </td>
                  {enabledCodes.map(code => {
                    const colTotal = rows.reduce((s, r) => s + (r.marks[code] ?? 0), 0);
                    const colMax   = rows.length * (maxByCode[code] || 30);
                    return (
                      <td key={code} style={{ padding: "12px 10px", textAlign: "center" }}>
                        <div style={{ fontWeight: 800, color: "#1e293b", fontSize: ".9rem" }}>{colTotal}</div>
                        <div style={{ fontSize: ".6rem", color: "#94a3b8" }}>/{colMax}</div>
                      </td>
                    );
                  })}
                  <td style={{ padding: "12px 10px", textAlign: "center" }}>
                    <div style={{ fontWeight: 900, fontSize: ".95rem", color: ovPct >= 50 ? "#1e293b" : "#ef4444" }}>{totalObtained}</div>
                    <div style={{ fontSize: ".64rem", color: ovPct >= 50 ? "#10b981" : "#ef4444", fontWeight: 700 }}>{ovPct.toFixed(1)}%</div>
                  </td>
                  <td style={{ padding: "12px 10px", textAlign: "center" }}>
                    {(() => {
                      const { bg, color } = gradeColor(ovGrade);
                      return (
                        <span style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          minWidth: 38, padding: "4px 10px", borderRadius: 999,
                          background: bg, color, fontWeight: 800, fontSize: ".82rem"
                        }}>
                          {ovGrade}
                        </span>
                      );
                    })()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Stats footer */}
          <div style={{
            padding: "14px 22px", borderTop: "1px solid #e2e8f0",
            background: "#fafbfc",
            display: "flex", gap: 28, flexWrap: "wrap", alignItems: "center"
          }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} />
              <span style={{ fontSize: ".78rem", color: "#475569" }}>
                <strong style={{ color: "#1e293b" }}>{passed}</strong> subjects passed
              </span>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
              <span style={{ fontSize: ".78rem", color: "#475569" }}>
                <strong style={{ color: "#1e293b" }}>{rows.length - passed}</strong> subjects failed
              </span>
            </div>
            {selectedGroup.position !== undefined && (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: "1rem" }}>🏅</span>
                <span style={{ fontSize: ".78rem", color: "#475569" }}>
                  Class Position: <strong style={{ color: "#1e293b" }}>{ordinal(selectedGroup.position)}</strong>
                </span>
              </div>
            )}
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
              {(() => {
                const { bg, color } = gradeColor(ovGrade);
                return (
                  <>
                    <span style={{ fontSize: ".78rem", color: "#475569" }}>Overall Grade:</span>
                    <span style={{ padding: "3px 12px", borderRadius: 999, background: bg, color, fontWeight: 800, fontSize: ".82rem" }}>
                      {ovGrade}
                    </span>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
