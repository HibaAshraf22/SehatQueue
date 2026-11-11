
import { useEffect, useState } from "react";
import {
  Users,
  Clock,
  CheckCircle,
  RefreshCw,
  Stethoscope
} from "lucide-react";

const API_URL = "https://sehat-queue.vercel.app";
const HOSPITAL_ID = "6ae1e0982680c6ba837e0f45";

function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function Queue() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [date, setDate] = useState(getToday());
  const [appointments, setAppointments] = useState([]);
  const [queueInfo, setQueueInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const getToken = () => localStorage.getItem("adminToken");

  const loadDoctors = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/admin/doctors/hospital/${HOSPITAL_ID}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load doctors");
      }

      setDoctors(data);

      if (data.length > 0) {
        setSelectedDoctor((current) => current || data[0]._id);
      }
    } catch (err) {
      setError(err.message || "Unable to load doctors");
      setLoading(false);
    }
  };

  const loadQueue = async () => {
    if (!selectedDoctor || !date) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/admin/doctor/${selectedDoctor}/queue?date=${date}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load queue");
      }

      setQueueInfo(data);
      setAppointments(data.appointments || []);
    } catch (err) {
      setError(err.message || "Unable to load queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      loadQueue();
    }
  }, [selectedDoctor, date]);

  const updateStatus = async (appointmentId, status) => {
    try {
      setUpdatingId(appointmentId);
      setError("");

      const response = await fetch(
        `${API_URL}/api/admin/appointment/${appointmentId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`
          },
          body: JSON.stringify({ status })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update status");
      }

      await loadQueue();
    } catch (err) {
      setError(err.message || "Unable to update status");
    } finally {
      setUpdatingId("");
    }
  };

  const waitingCount = appointments.filter(
    (item) => item.status === "waiting"
  ).length;

  const completedCount = appointments.filter(
    (item) => item.status === "completed"
  ).length;

  return (
    <div className="queue-page">
      <div className="page-heading">
        <div>
          <h1>Queue Management</h1>
          <p>Monitor and manage the daily patient queue.</p>
        </div>

        <button
          className="refresh-btn"
          onClick={loadQueue}
          disabled={loading || !selectedDoctor}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <div className="queue-filters">
        <div className="queue-filter-group">
          <label>Select Doctor</label>

          <select
            value={selectedDoctor}
            onChange={(event) => setSelectedDoctor(event.target.value)}
          >
            {doctors.length === 0 && (
              <option value="">No doctors available</option>
            )}

            {doctors.map((doctor) => (
              <option key={doctor._id} value={doctor._id}>
                {doctor.name} - {doctor.specialization}
              </option>
            ))}
          </select>
        </div>

        <div className="queue-filter-group">
          <label>Select Date</label>

          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="queue-stats">
        <div className="queue-stat-card">
          <div className="queue-stat-icon">
            <Users size={20} />
          </div>
          <div>
            <span>Total Appointments</span>
            <h2>{queueInfo.totalAppointments ?? appointments.length}</h2>
          </div>
        </div>

        <div className="queue-stat-card">
          <div className="queue-stat-icon waiting-icon">
            <Clock size={20} />
          </div>
          <div>
            <span>Waiting Patients</span>
            <h2>{waitingCount}</h2>
          </div>
        </div>

        <div className="queue-stat-card">
          <div className="queue-stat-icon completed-icon">
            <CheckCircle size={20} />
          </div>
          <div>
            <span>Completed</span>
            <h2>{completedCount}</h2>
          </div>
        </div>

        <div className="queue-stat-card">
          <div className="queue-stat-icon doctor-icon">
            <Stethoscope size={20} />
          </div>
          <div>
            <span>Now Serving</span>
            <h2>#{queueInfo.nowServing ?? 0}</h2>
          </div>
        </div>
      </div>

      <div className="queue-table-card">
        <div className="queue-table-heading">
          <h2>Patient Queue</h2>
          <span>{date}</span>
        </div>

        {loading ? (
          <div className="empty-state">Loading queue...</div>
        ) : appointments.length === 0 ? (
          <div className="empty-state">No appointments found for this date.</div>
        ) : (
          <div className="queue-table-wrapper">
            <table className="queue-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Patient</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Update Status</th>
                </tr>
              </thead>

              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment._id}>
                    <td>
                      <strong className="queue-token">
                        #{appointment.tokenNumber}
                      </strong>
                    </td>

                    <td>
                      <div className="queue-patient">
                        <strong>
                          {appointment.patient?.name || "Unknown patient"}
                        </strong>
                        <span>
                          {appointment.patient?.email || "No email"}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className={`source-badge ${appointment.source}`}>
                        {appointment.source === "walk-in"
                          ? "Walk-in"
                          : "Online"}
                      </span>
                    </td>

                    <td>
                      <span className={`status-badge status-${appointment.status}`}>
                        {appointment.status}
                      </span>
                    </td>

                    <td>
                      <select
                        className="status-select"
                        value={appointment.status}
                        disabled={updatingId === appointment._id}
                        onChange={(event) =>
                          updateStatus(appointment._id, event.target.value)
                        }
                      >
                        <option value="waiting">Waiting</option>
                        <option value="called">Called</option>
                        <option value="completed">Completed</option>
                        <option value="no-show">No-show</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Queue;
