import { useEffect, useState } from "react";
import { api } from "../lib/api";

function formatDate(d) {
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

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

const EMPTY_FORM = { name: "", startDate: "", endDate: "" };

export default function AcademicYears() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  // Create / Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null); // null = create mode
  const [form, setForm] = useState(EMPTY_FORM);

  async function load() {
    setError("");
    setLoading(true);
    try {
      const { data } = await api.get("/api/academic-years");
      setItems(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load academic years");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function onChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function openCreate() {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  }

  function openEdit(year) {
    setEditItem(year);
    setForm({
      name: year.name,
      startDate: formatDate(year.startDate),
      endDate: formatDate(year.endDate)
    });
    setError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditItem(null);
    setForm(EMPTY_FORM);
    setError("");
  }

  async function submitForm(e) {
    e.preventDefault();
    setError("");

    if (!form.name || !form.startDate || !form.endDate) {
      setError("Please fill name, start date, and end date");
      return;
    }

    try {
      if (editItem) {
        await api.put(`/api/academic-years/${editItem._id}`, {
          name: form.name.trim(),
          startDate: form.startDate,
          endDate: form.endDate
        });
      } else {
        await api.post("/api/academic-years", {
          name: form.name.trim(),
          startDate: form.startDate,
          endDate: form.endDate
        });
      }
      closeModal();
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || `Failed to ${editItem ? "update" : "create"} academic year`);
    }
  }

  async function activateYear(id) {
    if (!window.confirm("Are you sure you want to activate this academic year? This will affect the entire system.")) return;
    setError("");
    setBusyId(id);
    try {
      await api.patch(`/api/academic-years/${id}/activate`);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to activate academic year");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteYear(id, name) {
    if (!window.confirm(`Delete "${name}"? This action cannot be undone.`)) return;
    setError("");
    setBusyId(id);
    try {
      await api.delete(`/api/academic-years/${id}`);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete academic year");
    } finally {
      setBusyId(null);
    }
  }

  const active = items.find((x) => x.status === "active");

  return (
    <div>
      <div className="page-header">
        <h1>Academic Years</h1>
        <p>Manage school calendar periods. Only one academic year can be active at a time.</p>

        {active && (
          <div className="alert alert-success" style={{ marginTop: 16 }}>
            Active Year: <strong style={{ marginLeft: 6 }}>{active.name}</strong>
          </div>
        )}
        {error && <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>}
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">All Academic Years</div>
            <div className="card-subtitle">{items.length} records found</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            + New Academic Year
          </button>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
             <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12.5a1.5 1.5 0 0 1-2.4 1.2L12 14.25 6.4 18.7A1.5 1.5 0 0 1 4 17.5V5Z"/></svg>
              <h3>No academic years found</h3><p>Create your first academic year to get started.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((y) => (
                    <tr key={y._id}>
                      <td style={{ fontWeight: 600 }}>{y.name}</td>
                      <td className="td-muted">{formatDate(y.startDate)}</td>
                      <td className="td-muted">{formatDate(y.endDate)}</td>
                      <td>
                        <span className={`badge ${y.status === "active" ? "badge-green" : "badge-gray"}`}>
                          {y.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                          {y.status !== "active" && (
                            <button
                              disabled={busyId === y._id}
                              onClick={() => activateYear(y._id)}
                              className="btn btn-secondary btn-sm"
                            >
                              {busyId === y._id ? "..." : "Set Active"}
                            </button>
                          )}
                          <button
                            disabled={busyId === y._id}
                            onClick={() => openEdit(y)}
                            className="btn btn-secondary btn-sm"
                            title="Edit"
                          >
                            ✏️ Edit
                          </button>
                          {y.status !== "active" && (
                            <button
                              disabled={busyId === y._id}
                              onClick={() => deleteYear(y._id, y.name)}
                              className="btn btn-danger btn-sm"
                              title="Delete"
                            >
                              🗑️ Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal visible={showModal} onClose={closeModal} title={editItem ? "Edit Academic Year" : "Create Academic Year"}>
        <form onSubmit={submitForm}>
          <div className="modal-body">
            {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
            <div className="form-grid" style={{ gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  placeholder="e.g. 2026/2027"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={onChange}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={onChange}
                  className="form-input"
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {editItem ? "Save Changes" : "Create Year"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}