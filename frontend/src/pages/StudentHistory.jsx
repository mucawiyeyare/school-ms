import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";

export default function StudentHistory() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [student, setStudent] = useState(null);

  useEffect(() => {
    async function load() {
      setError("");
      setLoading(true);
      try {
        const { data } = await api.get(`/api/students/${id}/history`);
        setStudent(data.student);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1>Student Profile</h1>
          {student ? (
            <p>Profile and class placement for <strong style={{color:"var(--text)"}}>{student.firstName} {student.lastName}</strong></p>
          ) : (
            <p>Loading student profile...</p>
          )}
        </div>
        <Link to="/students" className="btn btn-secondary">
          ← Back to Directory
        </Link>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Current Class Placement</div>
            <div className="card-subtitle">Active academic year and class details</div>
          </div>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
             <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>Loading profile...</div>
          ) : !student?.classLevelId ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z"/></svg>
              <h3>No class assigned yet</h3><p>This student hasn't been placed in a class.</p>
            </div>
          ) : (
             <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Academic Year</th>
                    <th>Class Level</th>
                    <th>Section</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>{student.academicYearId?.name || "—"}</td>
                    <td className="td-muted">{student.classLevelId?.name || "—"}</td>
                    <td className="td-muted">{student.sectionId?.name || "—"}</td>
                    <td>
                      <span className={`badge ${student.status === "active" ? "badge-green" : "badge-gray"}`}>
                        {student.status}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}