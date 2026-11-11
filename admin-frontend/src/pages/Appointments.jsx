
import { useEffect, useState } from "react";
import {
  CalendarCheck,
  User,
  Stethoscope,
  RefreshCw,
  Trash2,
  Plus,
  X
} from "lucide-react";

const API_URL = "https://sehat-queue.vercel.app";
const HOSPITAL_ID = "6ae1e0982680c6ba837e0f45";

const getTodayDate = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year").value;
  const month = parts.find((part) => part.type === "month").value;
  const day = parts.find((part) => part.type === "day").value;

  return `${year}-${month}-${day}`;
};

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [updatingId, setUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const [showWalkInForm, setShowWalkInForm] = useState(false);
  const [addingWalkIn, setAddingWalkIn] = useState(false);

  const [walkInData, setWalkInData] = useState({
    name: "",
    phone: "",
    department: "",
    doctor: "",
    appointmentDate: getTodayDate()
  });

  const token = localStorage.getItem("adminToken");

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/admin/appointments`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load appointments");
      }

      setAppointments(
        Array.isArray(data) ? data : data.appointments || []
      );
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const loadFormOptions = async () => {
    try {
      const [doctorResponse, departmentResponse] = await Promise.all([
        fetch(
          `${API_URL}/api/admin/doctors/hospital/${HOSPITAL_ID}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        ),
        fetch(
          `${API_URL}/api/departments/hospital/${HOSPITAL_ID}`
        )
      ]);

      const doctorData = await doctorResponse.json();
      const departmentData = await departmentResponse.json();

      if (!doctorResponse.ok) {
        throw new Error(doctorData.message || "Unable to load doctors");
      }

      if (!departmentResponse.ok) {
        throw new Error(
          departmentData.message || "Unable to load departments"
        );
      }

      setDoctors(
        Array.isArray(doctorData)
          ? doctorData
          : doctorData.doctors || []
      );

      setDepartments(
        Array.isArray(departmentData)
          ? departmentData
          : departmentData.departments || []
      );
    } catch (err) {
      setError(err.message || "Unable to load form options");
    }
  };

  useEffect(() => {
    loadAppointments();
    loadFormOptions();
  }, []);

  const updateStatus = async (appointmentId, status) => {
    try {
      setUpdatingId(appointmentId);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/api/admin/appointment/${appointmentId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update status");
      }

      await loadAppointments();
    } catch (err) {
      setError(err.message || "Unable to update appointment");
    } finally {
      setUpdatingId("");
    }
  };

  const deleteAppointment = async (appointmentId) => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this appointment?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(appointmentId);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/api/admin/appointment/${appointmentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete appointment");
      }

      setAppointments((previous) =>
        previous.filter(
          (appointment) => appointment._id !== appointmentId
        )
      );
    } catch (err) {
      setError(err.message || "Unable to delete appointment");
    } finally {
      setDeletingId("");
    }
  };

  const handleWalkInChange = (event) => {
    const { name, value } = event.target;

    setWalkInData((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const addWalkInPatient = async (event) => {
    event.preventDefault();

    if (walkInData.appointmentDate !== getTodayDate()) {
      setError("Walk-in appointments can only be created for today");
      return;
    }

    try {
      setAddingWalkIn(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/api/appointments/walk-in`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: walkInData.name,
            phone: walkInData.phone,
            hospital: HOSPITAL_ID,
            department: walkInData.department,
            doctor: walkInData.doctor,
            appointmentDate: walkInData.appointmentDate
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to add walk-in patient"
        );
      }

      const generatedToken = data.appointment?.tokenNumber;

      setSuccess(
        `Walk-in patient added successfully! Token number: #${generatedToken}`
      );

      setWalkInData({
        name: "",
        phone: "",
        department: "",
        doctor: "",
        appointmentDate: getTodayDate()
      });

      setShowWalkInForm(false);

      await loadAppointments();
    } catch (err) {
      setError(err.message || "Unable to add walk-in patient");
    } finally {
      setAddingWalkIn(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not set";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const selectedDoctors = doctors.filter((doctor) => {
    const doctorDepartment =
      doctor.department?._id || doctor.department;

    return (
      doctorDepartment?.toString() === walkInData.department
    );
  });

  const inputStyle = {
    width: "100%",
    padding: "11px 12px",
    border: "1px solid #D1D5DB",
    borderRadius: "8px",
    fontSize: "14px",
    background: "#FFFFFF",
    color: "#16324F",
    boxSizing: "border-box"
  };

  const labelStyle = {
    display: "block",
    marginBottom: "7px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#16324F"
  };

  return (
    <div className="appointments-page">
      <div className="page-heading">
        <div>
          <h1>Appointments</h1>
          <p>View and manage patient appointments.</p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            className="refresh-btn"
            onClick={loadAppointments}
            disabled={loading}
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          <button
            onClick={() => {
              setShowWalkInForm(!showWalkInForm);
              setError("");
              setSuccess("");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "10px 15px",
              border: "none",
              borderRadius: "8px",
              background: "#0F766E",
              color: "#FFFFFF",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            {showWalkInForm ? <X size={17} /> : <Plus size={17} />}
            {showWalkInForm ? "Close Form" : "Add Walk-in Patient"}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {success && (
        <div
          style={{
            padding: "12px 15px",
            marginBottom: "18px",
            borderRadius: "8px",
            background: "#DCFCE7",
            color: "#166534",
            fontWeight: "600"
          }}
        >
          {success}
        </div>
      )}

      {showWalkInForm && (
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "12px",
            padding: "22px",
            marginBottom: "22px",
            border: "1px solid #E5E7EB"
          }}
        >
          <h2 style={{ color: "#16324F", marginTop: 0 }}>
            Add Walk-in Patient
          </h2>

          <p style={{ color: "#64748B", fontSize: "14px" }}>
            Enter the details of a patient visiting the hospital directly.
          </p>

          <form onSubmit={addWalkInPatient}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px"
              }}
            >
              <div>
                <label style={labelStyle}>Patient Name *</label>
                <input
                  style={inputStyle}
                  type="text"
                  name="name"
                  value={walkInData.name}
                  onChange={handleWalkInChange}
                  placeholder="Enter patient name"
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Phone Number (Optional)</label>
                <input
                  style={inputStyle}
                  type="tel"
                  name="phone"
                  value={walkInData.phone}
                  onChange={handleWalkInChange}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label style={labelStyle}>Department *</label>
                <select
                  style={inputStyle}
                  name="department"
                  value={walkInData.department}
                  onChange={(event) => {
                    setWalkInData((previous) => ({
                      ...previous,
                      department: event.target.value,
                      doctor: ""
                    }));
                  }}
                  required
                >
                  <option value="">Select department</option>

                  {departments.map((department) => (
                    <option
                      key={department._id}
                      value={department._id}
                    >
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Doctor *</label>
                <select
                  style={inputStyle}
                  name="doctor"
                  value={walkInData.doctor}
                  onChange={handleWalkInChange}
                  required
                  disabled={!walkInData.department}
                >
                  <option value="">Select doctor</option>

                  {selectedDoctors.map((doctor) => (
                    <option
                      key={doctor._id}
                      value={doctor._id}
                    >
                      {doctor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Appointment Date *</label>
                <input
                  style={inputStyle}
                  type="date"
                  name="appointmentDate"
                  value={walkInData.appointmentDate}
                  onChange={handleWalkInChange}
                  min={getTodayDate()}
                  max={getTodayDate()}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={addingWalkIn}
              style={{
                marginTop: "20px",
                padding: "11px 20px",
                border: "none",
                borderRadius: "8px",
                background: "#0F766E",
                color: "#FFFFFF",
                fontWeight: "600",
                cursor: addingWalkIn ? "not-allowed" : "pointer",
                opacity: addingWalkIn ? 0.7 : 1
              }}
            >
              {addingWalkIn
                ? "Adding Patient..."
                : "Add Patient & Generate Token"}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="empty-state">Loading appointments...</div>
      ) : appointments.length === 0 ? (
        <div className="empty-state">No appointments found.</div>
      ) : (
        <div className="appointments-card">
          <div className="appointments-table-wrapper">
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Update</th>
                  <th>Delete</th>
                </tr>
              </thead>

              
<tbody>
  {appointments.map((appointment) => (
    <tr key={appointment._id}>
      <td data-label="Token">
        <span className="token-number">
          #{appointment.tokenNumber}
        </span>
      </td>

      <td data-label="Patient">
        <div className="table-person">
          <div className="table-icon">
            <User size={16} />
          </div>

          <div>
            <strong>
              {appointment.patient?.name || "Unknown patient"}
            </strong>
            <span>
              {appointment.patient?.email ||
                appointment.patient?.phone ||
                "No contact details"}
            </span>
          </div>
        </div>
      </td>

      <td data-label="Doctor">
        <div className="table-person">
          <div className="table-icon">
            <Stethoscope size={16} />
          </div>

          <div>
            <strong>
              {appointment.doctor?.name || "Unknown doctor"}
            </strong>
            <span>
              {appointment.doctor?.specialization ||
                "No specialization"}
            </span>
          </div>
        </div>
      </td>

      <td data-label="Date">
        <div className="date-info">
          <CalendarCheck size={16} />
          {formatDate(appointment.appointmentDate)}
        </div>
      </td>

      <td data-label="Source">
        <span className={`source-badge ${appointment.source}`}>
          {appointment.source === "walk-in" ? "Walk-in" : "Online"}
        </span>
      </td>

      <td data-label="Status">
        <span className={`status-badge status-${appointment.status}`}>
          {appointment.status}
        </span>
      </td>

      <td data-label="Update">
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

      <td data-label="Delete">
        <button
          className="delete-appointment-btn"
          onClick={() => deleteAppointment(appointment._id)}
          disabled={
            deletingId === appointment._id ||
            updatingId === appointment._id
          }
        >
          <Trash2 size={15} />
          {deletingId === appointment._id ? "Deleting..." : "Delete"}
        </button>
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

export default Appointments;
