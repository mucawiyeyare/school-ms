import { useEffect, useState } from "react";
import { api } from "../lib/api";

function fmtDate(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "—"; }
}

function printReceipt(p) {
  const win = window.open("", "_blank", "width=600,height=750");
  if (!win) return;
  const name = p.studentId ? (p.studentId.firstName + " " + p.studentId.lastName) : "—";
  const emis = p.studentId?.emisNumber || "—";
  const feeName = p.feeStructureId?.name || "—";
  const feeTotal = p.feeStructureId?.amount != null ? "$" + Number(p.feeStructureId.amount).toLocaleString() : "—";
  const amountPaid = p.amountPaid != null ? "$" + Number(p.amountPaid).toLocaleString() : "—";
  const balance = (p.feeStructureId?.amount != null && p.amountPaid != null)
    ? "$" + (Number(p.feeStructureId.amount) - Number(p.amountPaid)).toLocaleString() : "—";
  const method = (p.method || "—").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const status = p.status || "unpaid";
  const statusColors = { paid: "background:#dcfce7;color:#16a34a", partial: "background:#dbeafe;color:#1d4ed8", unpaid: "background:#fee2e2;color:#dc2626" };
  const statusStyle = statusColors[status] || statusColors.unpaid;
  const html = `<!DOCTYPE html><html><head><meta charset='utf-8'><title>Payment Receipt</title>
    <style>
    body{font-family:'Inter',Arial,sans-serif;background:#fff;color:#1a1a1a;margin:0;padding:0;}
    .page{max-width:520px;margin:32px auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px;}
    .header{text-align:center;margin-bottom:24px;}
    .header h1{margin:0 0 4px;font-size:1.6rem;color:#4f46e5;}
    .header p{margin:0;font-size:.85rem;color:#64748b;}
    .divider{border:none;border-top:2px dashed #e2e8f0;margin:20px 0;}
    table{width:100%;border-collapse:collapse;}
    td{padding:10px 4px;font-size:.9rem;}
    td:first-child{color:#64748b;width:48%;}
    td:last-child{font-weight:600;text-align:right;}
    .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:.78rem;font-weight:700;text-transform:capitalize;}
    .footer{text-align:center;margin-top:28px;font-size:.75rem;color:#94a3b8;}
    @media print{body{margin:0;}.page{border:none;margin:0;padding:24px;}}
    </style></head><body>
    <div class='page'>
    <div class='header'><h1>🏛️ Official Receipt</h1><p>Fee Payment Confirmation</p></div>
    <hr class='divider'>
    <table>
    <tr><td>Student Name</td><td>${name}</td></tr>
    <tr><td>EMIS Number</td><td>${emis}</td></tr>
    <tr><td>Receipt No.</td><td>${p.receiptNo || "—"}</td></tr>
    <tr><td>Fee Type</td><td>${feeName}</td></tr>
    <tr><td>Total Fee</td><td>${feeTotal}</td></tr>
    <tr><td>Amount Paid</td><td style='color:#16a34a'>${amountPaid}</td></tr>
    <tr><td>Balance</td><td style='color:#dc2626'>${balance}</td></tr>
    <tr><td>Payment Method</td><td>${method}</td></tr>
    <tr><td>Payment Date</td><td>${fmtDate(p.paymentDate)}</td></tr>
    <tr><td>Status</td><td><span class='badge' style='${statusStyle}'>${status}</span></td></tr>
    </table>
    <hr class='divider'>
    <div class='footer'>Generated on ${new Date().toLocaleString()} &mdash; Thank you!</div>
    </div>
    <script>window.onload=function(){window.print();}</script>
    </body></html>`;
  win.document.write(html);
  win.document.close();
}

function Modal({ visible, onClose, title, children }) {
  if (!visible) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeIn .2s ease"
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#ffffff", borderRadius: 20, width: "100%", maxWidth: 600,
        boxShadow: "0 20px 40px rgba(0,0,0,0.15)", overflow: "hidden", animation: "scaleIn .25s ease"
      }}>
        <div style={{
          padding: "24px 30px 20px", borderBottom: "1px solid #f1f5f9", display: "flex",
          alignItems: "center", justifyContent: "space-between", background: "linear-gradient(to right, #f8fafc, #ffffff)"
        }}>
          <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>{title}</h2>
          <button onClick={onClose} style={{
            background: "#f1f5f9", border: "none", width: 34, height: 34, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b", transition: "all .2s"
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#ef4444"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#64748b"; }}
          >
            <svg viewBox="0 0 24 24" fill="none" style={{width:18}}><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div style={{ padding: "24px 30px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

const METHOD_LABELS = {
  cash: { label: "Cash", icon: "💵", color: "#10b981", bg: "#d1fae5" },
  bank_transfer: { label: "Bank Transfer", icon: "🏦", color: "#3b82f6", bg: "#dbeafe" },
  mobile_money: { label: "Mobile Money", icon: "📱", color: "#8b5cf6", bg: "#ede9fe" },
  cheque: { label: "Cheque", icon: "📑", color: "#f59e0b", bg: "#fef3c7" },
  other: { label: "Other", icon: "💳", color: "#64748b", bg: "#f1f5f9" }
};

export default function Fees() {
  const [tab, setTab] = useState("payments"); // payments, structures
  const [structures, setStructures] = useState([]);
  const [payments, setPayments] = useState([]);
  const [years, setYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showStructureModal, setShowStructureModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  
  const [structureForm, setStructureForm] = useState({ name: "", academicYearId: "", classLevelId: "", amount: "", dueDate: "", description: "" });
  const [paymentForm, setPaymentForm] = useState({ feeStructureId: "", studentId: "", amountPaid: "", method: "cash", receiptNo: "", status: "paid", notes: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const [sRes, pRes, yRes, cRes, stRes] = await Promise.all([
        api.get("/api/fees/structures"),
        api.get("/api/fees/payments"),
        api.get("/api/academic-years"),
        api.get("/api/classes"),
        api.get("/api/students?limit=2000")
      ]);
      setStructures(sRes.data || []);
      setPayments(pRes.data || []);
      setYears(yRes.data || []);
      setClasses(cRes.data || []);
      setStudents(stRes.data?.items || []);
    } catch (e) { setError("Failed to load data."); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function saveStructure() {
    if (!structureForm.name || !structureForm.amount || !structureForm.academicYearId) {
      setError("Name, Amount and Academic Year are required"); return;
    }
    setSaving(true); setError(""); setSuccess("");
    try {
      await api.post("/api/fees/structures", { ...structureForm, amount: Number(structureForm.amount), classLevelId: structureForm.classLevelId || undefined });
      setShowStructureModal(false); 
      setSuccess("Fee Type created successfully!");
      setTimeout(() => setSuccess(""), 3000);
      load();
    } catch (e) { setError(e.response?.data?.message || "Failed to create fee type."); }
    finally { setSaving(false); }
  }

  async function savePayment() {
    if (!paymentForm.feeStructureId || !paymentForm.studentId || !paymentForm.amountPaid) {
      setError("Fee Type, Student and Amount Paid are required"); return;
    }
    setSaving(true); setError(""); setSuccess("");
    try {
      await api.post("/api/fees/payments", { ...paymentForm, amountPaid: Number(paymentForm.amountPaid) });
      setShowPaymentModal(false);
      setSuccess("Payment recorded successfully!");
      setTimeout(() => setSuccess(""), 3000);
      load();
    } catch (e) { setError(e.response?.data?.message || "Failed to record payment."); }
    finally { setSaving(false); }
  }

  async function confirmDelete() {
    try {
      if (tab === "structures") await api.delete(`/api/fees/structures/${deleteId}`);
      else await api.delete(`/api/fees/payments/${deleteId}`);
      setDeleteId(null); 
      setSuccess("Record deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
      load();
    } catch (e) { setError(e.response?.data?.message || "Delete failed"); }
  }

  const totalCollected = payments.filter(p => ["paid", "partial"].includes(p.status)).reduce((s, p) => s + (p.amountPaid||0), 0);
  const pendingCount = payments.filter(p => p.status === "unpaid" || p.status === "partial").length;

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* Dynamic Professional Header */}
      <div style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #3730a3 100%)",
        borderRadius: 24, padding: "32px 40px", marginBottom: 32, color: "#fff",
        boxShadow: "0 10px 30px rgba(55, 48, 163, 0.25)", position: "relative", overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: -50, right: -50, width: 250, height: 250, background: "rgba(255,255,255,0.05)", borderRadius: "50%", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: -50, left: 100, width: 200, height: 200, background: "rgba(99, 102, 241, 0.15)", borderRadius: "50%", filter: "blur(30px)" }} />
        
        <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: "0 0 6px", position: "relative", zIndex: 1, letterSpacing: "-.02em" }}>Payment Management</h1>
        <p style={{ margin: 0, fontSize: ".95rem", color: "rgba(255,255,255,0.7)", position: "relative", zIndex: 1 }}>
          Record student payments, print receipts, and manage various fee types securely.
        </p>

        {/* Floating Stat Cards inside header space */}
        <div style={{ display: "flex", gap: 20, marginTop: 32, position: "relative", zIndex: 1, flexWrap: "wrap" }}>
          <div style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, flex: "1 1 200px" }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(16, 185, 129, 0.2)", color: "#34d399", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>💰</div>
            <div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, lineHeight: 1 }}>${totalCollected.toLocaleString()}</div>
              <div style={{ fontSize: ".8rem", color: "rgba(255,255,255,0.7)", marginTop: 4, fontWeight: 500 }}>Total Collected</div>
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, flex: "1 1 200px" }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(239, 68, 68, 0.2)", color: "#f87171", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>⏳</div>
            <div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, lineHeight: 1 }}>{pendingCount}</div>
              <div style={{ fontSize: ".8rem", color: "rgba(255,255,255,0.7)", marginTop: 4, fontWeight: 500 }}>Pending Payments</div>
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, flex: "1 1 200px" }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(99, 102, 241, 0.2)", color: "#818cf8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>📋</div>
            <div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, lineHeight: 1 }}>{structures.length}</div>
              <div style={{ fontSize: ".8rem", color: "rgba(255,255,255,0.7)", marginTop: 4, fontWeight: 500 }}>Active Fee Types</div>
            </div>
          </div>
        </div>
      </div>

      {success && <div style={{ padding: "14px 20px", borderRadius: 12, marginBottom: 20, background: "#d1fae5", border: "1px solid #10b981", color: "#065f46", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(16,185,129,0.15)", animation: "slideIn .3s ease" }}><span>✅</span> {success}</div>}
      {error && <div style={{ padding: "14px 20px", borderRadius: 12, marginBottom: 20, background: "#fee2e2", border: "1px solid #ef4444", color: "#991b1b", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, animation: "fadeIn .3s ease" }}><span>⚠️</span> {error}</div>}

      <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", overflow: "hidden" }}>
        {/* Navigation & Actions */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid #f1f5f9", flexWrap: "wrap", gap: 16, background: "#fafbfc" }}>
          
          {/* Custom Tabs */}
          <div style={{ display: "flex", background: "#f1f5f9", padding: 4, borderRadius: 12 }}>
            <button onClick={() => setTab("payments")} style={{
              padding: "8px 20px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: ".88rem", cursor: "pointer", transition: "all .2s",
              background: tab === "payments" ? "#fff" : "transparent",
              color: tab === "payments" ? "#4f46e5" : "#64748b",
              boxShadow: tab === "payments" ? "0 2px 6px rgba(0,0,0,0.05)" : "none"
            }}>Transactions List</button>
            <button onClick={() => setTab("structures")} style={{
              padding: "8px 20px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: ".88rem", cursor: "pointer", transition: "all .2s",
              background: tab === "structures" ? "#fff" : "transparent",
              color: tab === "structures" ? "#4f46e5" : "#64748b",
              boxShadow: tab === "structures" ? "0 2px 6px rgba(0,0,0,0.05)" : "none"
            }}>Manage Fee Types</button>
          </div>

          <div>
            {tab === "payments" ? (
              <button onClick={() => { setPaymentForm({ feeStructureId: structures[0]?._id||"", studentId: "", amountPaid: "", method: "cash", receiptNo: "", status: "paid", notes: "" }); setShowPaymentModal(true); }}
                style={{ padding: "10px 24px", borderRadius: 12, background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)", color: "#fff", border: "none", fontWeight: 700, fontSize: ".9rem", cursor: "pointer", boxShadow: "0 4px 14px rgba(79,70,229,0.3)", transition: "transform .15s", display: "flex", alignItems: "center", gap: 8 }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}
              >
                <span>➕</span> Record New Payment
              </button>
            ) : (
              <button onClick={() => { setStructureForm({ name: "", academicYearId: years.find(y=>y.status==="active")?._id||"", classLevelId: "", amount: "", dueDate: "", description: "" }); setShowStructureModal(true); }}
                style={{ padding: "10px 24px", borderRadius: 12, background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)", color: "#fff", border: "none", fontWeight: 700, fontSize: ".9rem", cursor: "pointer", boxShadow: "0 4px 14px rgba(16,185,129,0.3)", transition: "transform .15s", display: "flex", alignItems: "center", gap: 8 }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}
              >
                <span>➕</span> Create Fee Type
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 80, textAlign: "center", color: "#94a3b8" }}>
              <div style={{ animation: "spin 1s linear infinite", fontSize: "2rem", marginBottom: 16 }}>⏳</div>
              <div style={{ fontWeight: 600 }}>Loading records...</div>
            </div>
          ) : tab === "payments" ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ padding: "16px 24px", textAlign: "left", fontSize: ".75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>Student Name</th>
                    <th style={{ padding: "16px 24px", textAlign: "left", fontSize: ".75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>Fee Type</th>
                    <th style={{ padding: "16px 24px", textAlign: "left", fontSize: ".75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>Amount</th>
                    <th style={{ padding: "16px 24px", textAlign: "left", fontSize: ".75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>Method</th>
                    <th style={{ padding: "16px 24px", textAlign: "center", fontSize: ".75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>Status</th>
                    <th style={{ padding: "16px 24px", textAlign: "left", fontSize: ".75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>Date</th>
                    <th style={{ padding: "16px 24px", textAlign: "right", fontSize: ".75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>No payments recorded yet.</td></tr>
                  ) : payments.map(p => {
                    const met = METHOD_LABELS[p.method] || METHOD_LABELS.other;
                    const isPaid = p.status === "paid";
                    const isPartial = p.status === "partial";
                    return (
                      <tr key={p._id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background .15s" }} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "16px 24px" }}>
                          <div style={{ fontWeight: 700, color: "#0f172a" }}>{p.studentId?.firstName} {p.studentId?.lastName}</div>
                          <div style={{ fontSize: ".75rem", color: "#64748b", marginTop: 2 }}>{p.studentId?.emisNumber || "No EMIS"}</div>
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <div style={{ fontWeight: 600, color: "#334155" }}>{p.feeStructureId?.name || "—"}</div>
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "1.05rem" }}>${Number(p.amountPaid).toLocaleString()}</div>
                          <div style={{ fontSize: ".75rem", color: "#94a3b8", fontWeight: 500 }}>of ${Number(p.feeStructureId?.amount || 0).toLocaleString()}</div>
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: met.bg, color: met.color, padding: "4px 10px", borderRadius: 8, fontSize: ".8rem", fontWeight: 700 }}>
                            <span>{met.icon}</span> {met.label}
                          </div>
                        </td>
                        <td style={{ padding: "16px 24px", textAlign: "center" }}>
                          <div style={{ display: "inline-flex", padding: "4px 12px", borderRadius: 20, fontSize: ".75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em", background: isPaid ? "#d1fae5" : isPartial ? "#fef3c7" : "#fee2e2", color: isPaid ? "#059669" : isPartial ? "#d97706" : "#dc2626" }}>
                            {p.status}
                          </div>
                        </td>
                        <td style={{ padding: "16px 24px", color: "#64748b", fontSize: ".85rem", fontWeight: 500 }}>
                          {fmtDate(p.paymentDate)}
                        </td>
                        <td style={{ padding: "16px 24px", textAlign: "right" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                            <button onClick={() => printReceipt(p)} title="Print Receipt" style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .2s", color: "#4f46e5" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "#4f46e5"; e.currentTarget.style.background = "#eef2ff"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#fff"; }}>🖨️</button>
                            <button onClick={() => setDeleteId(p._id)} title="Delete Payment" style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .2s", color: "#ef4444" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.background = "#fef2f2"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#fff"; }}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 20 }}>
              {structures.length === 0 ? (
                <div style={{ gridColumn: "1/-1", padding: 60, textAlign: "center", color: "#94a3b8" }}>No Fee Types registered.</div>
              ) : structures.map(s => (
                <div key={s._id} style={{ border: "1px solid #e2e8f0", borderRadius: 16, padding: 24, transition: "box-shadow .2s", background: "#fff" }} onMouseEnter={e => e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.05)"} onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                    <div>
                      <h3 style={{ margin: "0 0 4px", fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>{s.name}</h3>
                      <div style={{ fontSize: ".8rem", color: "#64748b" }}>{s.academicYearId?.name || "All Years"} • {s.classLevelId?.name || "All Classes"}</div>
                    </div>
                    <div style={{ background: "#eef2ff", color: "#4f46e5", fontWeight: 800, padding: "6px 12px", borderRadius: 10, fontSize: "1.1rem" }}>
                      ${Number(s.amount).toLocaleString()}
                    </div>
                  </div>
                  <p style={{ margin: "0 0 20px", fontSize: ".85rem", color: "#475569", minHeight: 40 }}>{s.description || "No description provided."}</p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px dashed #e2e8f0", paddingTop: 16 }}>
                    <div style={{ fontSize: ".75rem", color: "#94a3b8", fontWeight: 600 }}>Due: {s.dueDate ? new Date(s.dueDate).toLocaleDateString() : "No due date"}</div>
                    <button onClick={() => { setTab("structures"); setDeleteId(s._id); }} style={{ padding: "6px 14px", borderRadius: 8, fontSize: ".75rem", fontWeight: 700, border: "none", background: "#fee2e2", color: "#dc2626", cursor: "pointer", transition: "background .2s" }} onMouseEnter={e => e.currentTarget.style.background = "#fecaca"} onMouseLeave={e => e.currentTarget.style.background = "#fee2e2"}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Payment Modal */}
      <Modal visible={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Record New Payment">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ display: "block", fontSize: ".85rem", fontWeight: 700, color: "#334155", marginBottom: 6 }}>Student Name <span style={{color:"#ef4444"}}>*</span></label>
            <select value={paymentForm.studentId} onChange={e => setPaymentForm(f => ({ ...f, studentId: e.target.value }))} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1.5px solid #cbd5e1", fontSize: ".9rem", fontWeight: 500, outline: "none", boxSizing: "border-box", transition: "border .2s" }}>
              <option value="">-- Choose Student --</option>
              {students.map(s => <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.emisNumber || "No EMIS"})</option>)}
            </select>
          </div>
          
          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ display: "block", fontSize: ".85rem", fontWeight: 700, color: "#334155", marginBottom: 6 }}>Fee Type <span style={{color:"#ef4444"}}>*</span></label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
              {structures.map(s => (
                <div key={s._id} onClick={() => setPaymentForm(f => ({ ...f, feeStructureId: s._id, amountPaid: s.amount }))} style={{ padding: "12px 16px", border: `2px solid ${paymentForm.feeStructureId === s._id ? "#4f46e5" : "#e2e8f0"}`, borderRadius: 12, cursor: "pointer", background: paymentForm.feeStructureId === s._id ? "#eef2ff" : "#fff", transition: "all .15s" }}>
                  <div style={{ fontWeight: 700, color: paymentForm.feeStructureId === s._id ? "#3730a3" : "#334155", fontSize: ".9rem" }}>{s.name}</div>
                  <div style={{ fontWeight: 800, color: paymentForm.feeStructureId === s._id ? "#4f46e5" : "#64748b", fontSize: "1.1rem", marginTop: 4 }}>${s.amount}</div>
                </div>
              ))}
            </div>
            {structures.length === 0 && <div style={{ fontSize: ".85rem", color: "#ef4444" }}>No fee types available. Please create one first.</div>}
          </div>

          <div>
            <label style={{ display: "block", fontSize: ".85rem", fontWeight: 700, color: "#334155", marginBottom: 6 }}>Amount Paid ($) <span style={{color:"#ef4444"}}>*</span></label>
            <input type="number" placeholder="e.g. 50" value={paymentForm.amountPaid} onChange={e => setPaymentForm(f => ({ ...f, amountPaid: e.target.value }))} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1.5px solid #cbd5e1", fontSize: ".9rem", fontWeight: 500, outline: "none", boxSizing: "border-box" }} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: ".85rem", fontWeight: 700, color: "#334155", marginBottom: 6 }}>Payment Method</label>
            <select value={paymentForm.method} onChange={e => setPaymentForm(f => ({ ...f, method: e.target.value }))} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1.5px solid #cbd5e1", fontSize: ".9rem", fontWeight: 500, outline: "none", boxSizing: "border-box" }}>
              {Object.entries(METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: ".85rem", fontWeight: 700, color: "#334155", marginBottom: 6 }}>Status</label>
            <select value={paymentForm.status} onChange={e => setPaymentForm(f => ({ ...f, status: e.target.value }))} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1.5px solid #cbd5e1", fontSize: ".9rem", fontWeight: 500, outline: "none", boxSizing: "border-box" }}>
              <option value="paid">✅ Paid</option>
              <option value="partial">⏳ Partial</option>
              <option value="unpaid">❌ Unpaid</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: ".85rem", fontWeight: 700, color: "#334155", marginBottom: 6 }}>Receipt Number (Optional)</label>
            <input placeholder="e.g. RCP-1002" value={paymentForm.receiptNo} onChange={e => setPaymentForm(f => ({ ...f, receiptNo: e.target.value }))} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1.5px solid #cbd5e1", fontSize: ".9rem", fontWeight: 500, outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>

        {error && <div style={{ marginTop: 16, padding: "10px 14px", background: "#fee2e2", color: "#991b1b", borderRadius: 8, fontSize: ".85rem", fontWeight: 600 }}>⚠️ {error}</div>}

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button onClick={() => setShowPaymentModal(false)} style={{ padding: "10px 20px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontWeight: 700, color: "#64748b", cursor: "pointer" }}>Cancel</button>
          <button onClick={savePayment} disabled={saving} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)", fontWeight: 700, color: "#fff", cursor: saving ? "not-allowed" : "pointer", boxShadow: "0 4px 12px rgba(79,70,229,0.2)" }}>
            {saving ? "Processing..." : "Confirm Payment"}
          </button>
        </div>
      </Modal>

      {/* New Fee Structure Modal */}
      <Modal visible={showStructureModal} onClose={() => setShowStructureModal(false)} title="Create New Fee Type">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ display: "block", fontSize: ".85rem", fontWeight: 700, color: "#334155", marginBottom: 6 }}>Fee Name <span style={{color:"#ef4444"}}>*</span></label>
            <input placeholder="e.g. Tuition Fee, Library Fee" value={structureForm.name} onChange={e => setStructureForm(f => ({ ...f, name: e.target.value }))} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1.5px solid #cbd5e1", fontSize: ".9rem", fontWeight: 500, outline: "none", boxSizing: "border-box" }} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: ".85rem", fontWeight: 700, color: "#334155", marginBottom: 6 }}>Amount ($) <span style={{color:"#ef4444"}}>*</span></label>
            <input type="number" placeholder="100" value={structureForm.amount} onChange={e => setStructureForm(f => ({ ...f, amount: e.target.value }))} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1.5px solid #cbd5e1", fontSize: ".9rem", fontWeight: 500, outline: "none", boxSizing: "border-box" }} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: ".85rem", fontWeight: 700, color: "#334155", marginBottom: 6 }}>Academic Year <span style={{color:"#ef4444"}}>*</span></label>
            <select value={structureForm.academicYearId} onChange={e => setStructureForm(f => ({ ...f, academicYearId: e.target.value }))} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1.5px solid #cbd5e1", fontSize: ".9rem", fontWeight: 500, outline: "none", boxSizing: "border-box" }}>
              <option value="">-- Select --</option>
              {years.map(y => <option key={y._id} value={y._id}>{y.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: ".85rem", fontWeight: 700, color: "#334155", marginBottom: 6 }}>Class Level (Optional)</label>
            <select value={structureForm.classLevelId} onChange={e => setStructureForm(f => ({ ...f, classLevelId: e.target.value }))} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1.5px solid #cbd5e1", fontSize: ".9rem", fontWeight: 500, outline: "none", boxSizing: "border-box" }}>
              <option value="">All Classes</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: ".85rem", fontWeight: 700, color: "#334155", marginBottom: 6 }}>Due Date (Optional)</label>
            <input type="date" value={structureForm.dueDate} onChange={e => setStructureForm(f => ({ ...f, dueDate: e.target.value }))} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1.5px solid #cbd5e1", fontSize: ".9rem", fontWeight: 500, outline: "none", boxSizing: "border-box" }} />
          </div>

          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ display: "block", fontSize: ".85rem", fontWeight: 700, color: "#334155", marginBottom: 6 }}>Description (Optional)</label>
            <textarea placeholder="Additional notes about this fee..." rows={3} value={structureForm.description} onChange={e => setStructureForm(f => ({ ...f, description: e.target.value }))} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1.5px solid #cbd5e1", fontSize: ".9rem", fontWeight: 500, outline: "none", resize: "none", boxSizing: "border-box" }} />
          </div>
        </div>

        {error && <div style={{ marginTop: 16, padding: "10px 14px", background: "#fee2e2", color: "#991b1b", borderRadius: 8, fontSize: ".85rem", fontWeight: 600 }}>⚠️ {error}</div>}

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button onClick={() => setShowStructureModal(false)} style={{ padding: "10px 20px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontWeight: 700, color: "#64748b", cursor: "pointer" }}>Cancel</button>
          <button onClick={saveStructure} disabled={saving} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)", fontWeight: 700, color: "#fff", cursor: saving ? "not-allowed" : "pointer", boxShadow: "0 4px 12px rgba(16,185,129,0.2)" }}>
            {saving ? "Saving..." : "Create Fee Type"}
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={!!deleteId} onClose={() => setDeleteId(null)} title="Confirm Deletion">
        <div style={{ textAlign: "center", padding: "10px 0 20px" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#fee2e2", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", margin: "0 auto 16px" }}>🗑️</div>
          <h3 style={{ margin: "0 0 8px", fontSize: "1.2rem", color: "#0f172a" }}>Are you absolutely sure?</h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: ".9rem" }}>This action cannot be undone. This record will be permanently deleted from our servers.</p>
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={() => setDeleteId(null)} style={{ padding: "10px 24px", borderRadius: 10, border: "1px solid #cbd5e1", background: "#fff", fontWeight: 700, color: "#475569", cursor: "pointer" }}>Cancel</button>
          <button onClick={confirmDelete} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "#ef4444", fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(239,68,68,0.25)" }}>Yes, Delete it</button>
        </div>
      </Modal>
    </div>
  );
}
