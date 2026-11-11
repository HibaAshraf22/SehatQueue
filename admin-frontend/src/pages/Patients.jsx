import { useEffect, useState } from "react";
import { UserRound, Mail, RefreshCw } from "lucide-react";

const API_URL = "https://sehat-queue.vercel.app";

function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("adminToken");

      const response = await fetch(`${API_URL}/api/admin/patients`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load patients");
      }

      setPatients(Array.isArray(data) ? data : data.patients || []);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  return (
    <div className="patients-page">
      <div className="page-heading">
        <div>
          <h1>Patients</h1>
          <p>View registered patients in the hospital system.</p>
        </div>

        <button
          className="refresh-btn"
          onClick={loadPatients}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading patients...</div>
      ) : patients.length === 0 ? (
        <div className="empty-state">No patients found.</div>
      ) : (
        <div className="patients-card">
          <div className="patients-table-wrapper">
            <table className="patients-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Patient ID</th>
                </tr>
              </thead>

              <tbody>
                {patients.map((patient) => (
                  <tr key={patient._id}>
                    <td>
                      <div className="patient-person">
                        <div className="patient-icon">
                          <UserRound size={17} />
                        </div>

                        <strong>{patient.name}</strong>
                      </div>
                    </td>

                    <td>
                      <div className="patient-email">
                        <Mail size={15} />
                        {patient.email}
                      </div>
                    </td>

                    <td>
                      <span className="patient-role">
                        {patient.role || "patient"}
                      </span>
                    </td>

                    <td>
                      <span className="patient-id">
                        {patient._id}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Patients;