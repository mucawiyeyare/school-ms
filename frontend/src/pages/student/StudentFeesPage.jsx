import { useOutletContext } from "react-router-dom";

function fmt(d) {
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "\u2014"; }
}

function printReceipt(p, student) {
  const win = window.open("", "_blank", "width=600,height=750");
  if (!win) return;

  const name = student ? student.firstName + " " + student.lastName : "Student";
  const emis = student?.emisNumber || "—";
  const feeName = p.feeStructureId?.name || "\u2014";
  const feeTotal = p.feeStructureId?.amount != null
    ? "$" + Number(p.feeStructureId.amount).toLocaleString() : "\u2014";
  const amountPaid = p.amountPaid != null
    ? "$" + Number(p.amountPaid).toLocaleString() : "\u2014";
  const balance = (p.feeStructureId?.amount != null && p.amountPaid != null)
    ? "$" + (Number(p.feeStructureId.amount) - Number(p.amountPaid)).toLocaleString()
    : "\u2014";
  const method = (p.method || "\u2014").replace(/_/g, " ");
  const receiptNo = p.receiptNo || "\u2014";
  const status = p.status || "unpaid";
  const paymentDate = fmt(p.paymentDate);
  const generatedOn = new Date().toLocaleString();

  const statusColors = {
    paid: "background:#dcfce7;color:#16a34a",
    partial: "background:#dbeafe;color:#1d4ed8",
    unpaid: "background:#fee2e2;color:#dc2626",
  };
  const statusStyle = statusColors[status] || statusColors.unpaid;

  const html = "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Payment Receipt</title>" +
    "<style>" +
    "body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1a1a1a;margin:0;padding:0;}" +
    ".page{max-width:520px;margin:32px auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px;}" +
    ".header{text-align:center;margin-bottom:24px;}" +
    ".header h1{margin:0 0 4px;font-size:1.4rem;color:#4f46e5;}" +
    ".header p{margin:0;font-size:.8rem;color:#64748b;}" +
    ".divider{border:none;border-top:2px dashed #e2e8f0;margin:20px 0;}" +
    "table{width:100%;border-collapse:collapse;}" +
    "td{padding:9px 4px;font-size:.88rem;}" +
    "td:first-child{color:#64748b;width:48%;}" +
    "td:last-child{font-weight:600;text-align:right;}" +
    ".badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:.75rem;font-weight:700;text-transform:capitalize;}" +
    ".footer{text-align:center;margin-top:28px;font-size:.75rem;color:#94a3b8;}" +
    "@media print{body{margin:0;}.page{border:none;margin:0;padding:24px;}}" +
    "</style></head><body>" +
    "<div class='page'>" +
    "<div class='header'><h1>&#127979; Payment Receipt</h1><p>Official Fee Payment Confirmation</p></div>" +
    "<hr class='divider'>" +
    "<table>" +
    "<tr><td>Student Name</td><td>" + name + "</td></tr>" +
    "<tr><td>EMIS Number</td><td>" + emis + "</td></tr>" +
    "<tr><td>Receipt No.</td><td>" + receiptNo + "</td></tr>" +
    "<tr><td>Fee Type</td><td>" + feeName + "</td></tr>" +
    "<tr><td>Total Fee</td><td>" + feeTotal + "</td></tr>" +
    "<tr><td>Amount Paid</td><td style='color:#16a34a'>" + amountPaid + "</td></tr>" +
    "<tr><td>Balance</td><td style='color:#dc2626'>" + balance + "</td></tr>" +
    "<tr><td>Payment Method</td><td style='text-transform:capitalize'>" + method + "</td></tr>" +
    "<tr><td>Payment Date</td><td>" + paymentDate + "</td></tr>" +
    "<tr><td>Status</td><td><span class='badge' style='" + statusStyle + "'>" + status + "</span></td></tr>" +
    "</table>" +
    "<hr class='divider'>" +
    "<div class='footer'>Generated on " + generatedOn + " &mdash; Thank you!</div>" +
    "</div>" +
    "<script>window.onload=function(){window.print();}<\/script>" +
    "</body></html>";

  win.document.write(html);
  win.document.close();
}

export default function StudentFees() {
  const { profileData, loading } = useOutletContext();

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>;
  if (!profileData) return null;

  const { feePayments = [], totalFeePaid = 0 } = profileData;

  const paid = feePayments.filter(p => p.status === "paid").length;
  const partial = feePayments.filter(p => p.status === "partial").length;

  const methodIcon = { cash: "💵", bank_transfer: "🏦", mobile_money: "📱", cheque: "📋", other: "💳" };

  return (
    <div>
      <div className="page-header">
        <h1>Fee Payments</h1>
        <p>Your payment history and fee records.</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Paid", value: `$${totalFeePaid.toLocaleString()}`, color: "#22c55e", icon: "💰" },
          { label: "Total Records", value: feePayments.length, color: "#6366f1", icon: "📄" },
          { label: "Fully Paid", value: paid, color: "#22c55e", icon: "✅" },
          { label: "Partial", value: partial, color: "#f59e0b", icon: "⏳" },
        ].map(c => (
          <div key={c.label} style={{ borderRadius: 16, padding: "20px 22px", background: `${c.color}0e`, border: `1px solid ${c.color}25`, boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
            <div style={{ fontSize: "1.4rem", marginBottom: 8 }}>{c.icon}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--text-muted)", marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {feePayments.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm-1 14v-2H9v-2h2v-1H9V9h2V7h2v2h2v2h-3v1h3v2h-2v2h-2Z"/></svg>
          <h3>No payment records</h3><p>Your fee payment records will appear here.</p>
        </div>
      ) : (
        <div className="card">
          <div className="card-header"><div className="card-title">Payment History</div></div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Fee</th>
                    <th>Amount Paid</th>
                    <th>Fee Amount</th>
                    <th>Date</th>
                    <th>Method</th>
                    <th>Receipt</th>
                    <th>Status</th>
                    <th>Print</th>
                  </tr>
                </thead>
                <tbody>
                  {feePayments.map(p => (
                    <tr key={p._id}>
                      <td style={{ fontWeight: 700 }}>{p.feeStructureId?.name || "—"}</td>
                      <td><span style={{ fontWeight: 800, color: "#22c55e" }}>${p.amountPaid?.toLocaleString()}</span></td>
                      <td className="td-muted">${p.feeStructureId?.amount?.toLocaleString() || "—"}</td>
                      <td className="td-muted">{fmt(p.paymentDate)}</td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: ".78rem" }}>
                          {methodIcon[p.method] || "💳"} {p.method?.replace("_", " ") || "—"}
                        </span>
                      </td>
                      <td><span style={{ fontFamily: "monospace", fontSize: ".78rem" }}>{p.receiptNo || "—"}</span></td>
                      <td>
                        <span className={`badge ${p.status === "paid" ? "badge-green" : p.status === "partial" ? "badge-blue" : "badge-red"}`} style={{ textTransform: "capitalize" }}>
                          {p.status}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => printReceipt(p, profileData?.student)}
                          style={{ background: "none", border: "1px solid var(--border-light)", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: ".75rem", fontWeight: 600, color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: 4 }}
                          title="Print Receipt"
                        >
                          🖨️ Print
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
