
import { useEffect, useState } from "react";
import {
  Building2,
  MapPin,
  Phone,
  RefreshCw,
  Hospital
} from "lucide-react";

const API_URL = "https://sehat-queue.vercel.app";

function Settings() {
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHospital = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("adminToken");

      const response = await fetch(`${API_URL}/api/hospitals`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load hospital details");
      }

      const hospitals = Array.isArray(data) ? data : data.hospitals || [];
      setHospital(hospitals[0] || null);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHospital();
  }, []);

  return (
    <div className="settings-page">
      <div className="page-heading">
        <div>
          <h1>Settings</h1>
          <p>View your hospital information and system details.</p>
        </div>

        <button
          className="refresh-btn"
          onClick={loadHospital}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading hospital information...</div>
      ) : !hospital ? (
        <div className="empty-state">No hospital information found.</div>
      ) : (
        <div className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-hospital-icon">
              <Hospital size={24} />
            </div>

            <div>
              <h2>Hospital Information</h2>
              <p>Registered hospital details</p>
            </div>
          </div>

          <div className="settings-details">
            <div className="settings-detail">
              <Building2 size={19} />
              <div>
                <span>Hospital Name</span>
                <strong>{hospital.name || "Not available"}</strong>
              </div>
            </div>

            <div className="settings-detail">
              <MapPin size={19} />
              <div>
                <span>Address</span>
                <strong>{hospital.address || "Not available"}</strong>
              </div>
            </div>

            <div className="settings-detail">
              <Phone size={19} />
              <div>
                <span>Contact</span>
                <strong>{hospital.contact || "Not available"}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
