
import { useEffect, useState } from "react";
import { Stethoscope, Clock, Building2, RefreshCw } from "lucide-react";

const API_URL = "http://localhost:5000";
const HOSPITAL_ID = "6ae1e0982680c6ba837e0f45";

function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const loadDoctors = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("adminToken");

      const response = await fetch(
        `${API_URL}/api/admin/doctors/hospital/${HOSPITAL_ID}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load doctors");
      }

      setDoctors(Array.isArray(data) ? data : data.doctors || []);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const toggleAvailability = async (doctor) => {
    try {
      setUpdatingId(doctor._id);
      setError("");

      const token = localStorage.getItem("adminToken");

      const response = await fetch(
        `${API_URL}/api/admin/doctor/${doctor._id}/availability`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            isAvailable: !doctor.isAvailable
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update availability");
      }

      await loadDoctors();
    } catch (err) {
      setError(err.message || "Unable to update doctor");
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <div className="doctors-page">
      <div className="page-heading">
        <div>
          <h1>Doctors Management</h1>
          <p>View doctors and manage their availability.</p>
        </div>

        <button
          className="refresh-btn"
          onClick={loadDoctors}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading doctors...</div>
      ) : doctors.length === 0 ? (
        <div className="empty-state">No doctors found for this hospital.</div>
      ) : (
        <div className="doctors-grid">
          {doctors.map((doctor) => (
            <div className="doctor-card" key={doctor._id}>
              <div className="doctor-card-top">
                <div className="doctor-icon">
                  <Stethoscope size={25} />
                </div>

                <span
                  className={
                    doctor.isAvailable
                      ? "availability available"
                      : "availability unavailable"
                  }
                >
                  {doctor.isAvailable ? "Available" : "Unavailable"}
                </span>
              </div>

              <h2>{doctor.name}</h2>
              <p className="doctor-specialization">
                {doctor.specialization}
              </p>

              <div className="doctor-details">
                <div>
                  <Stethoscope size={16} />
                  <span>
                    {doctor.department?.name || "Department not assigned"}
                  </span>
                </div>

                <div>
                  <Building2 size={16} />
                  <span>
                    {doctor.hospital?.name || "Hospital not assigned"}
                  </span>
                </div>

                <div>
                  <Clock size={16} />
                  <span>
                    {doctor.consultationStart || "Not set"} -{" "}
                    {doctor.consultationEnd || "Not set"}
                  </span>
                </div>
              </div>

              <button
                className={
                  doctor.isAvailable
                    ? "availability-btn make-unavailable"
                    : "availability-btn make-available"
                }
                onClick={() => toggleAvailability(doctor)}
                disabled={updatingId === doctor._id}
              >
                {updatingId === doctor._id
                  ? "Updating..."
                  : doctor.isAvailable
                    ? "Mark Unavailable"
                    : "Mark Available"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Doctors;
