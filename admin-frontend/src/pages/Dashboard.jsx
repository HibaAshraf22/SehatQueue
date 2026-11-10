
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Stethoscope,
  CalendarCheck,
  Clock,
  ArrowUpRight
} from "lucide-react";

const API_URL = "http://localhost:5000";
const HOSPITAL_ID = "6ae1e0982680c6ba837e0f45";

function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    doctors: 0,
    appointments: 0,
    waiting: 0,
    patients: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const token = localStorage.getItem("adminToken");

        if (!token) {
          throw new Error("Admin token not found");
        }

        const doctorResponse = await fetch(
          `${API_URL}/api/admin/doctors/hospital/${HOSPITAL_ID}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const doctorData = await doctorResponse.json();

        if (!doctorResponse.ok) {
          throw new Error(doctorData.message || "Unable to load doctors");
        }

        const doctors = Array.isArray(doctorData)
          ? doctorData
          : doctorData.doctors || [];

        const today = new Date().toISOString().split("T")[0];

        const queueResults = await Promise.all(
          doctors.map(async (doctor) => {
            const response = await fetch(
              `${API_URL}/api/admin/doctor/${doctor._id}/queue?date=${today}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );

            if (!response.ok) {
              return {
                appointments: []
              };
            }

            return response.json();
          })
        );

        let totalAppointments = 0;
        let waitingPatients = 0;
        const patientIds = new Set();

        queueResults.forEach((queue) => {
          const appointments = Array.isArray(queue.appointments)
            ? queue.appointments
            : [];

          totalAppointments += appointments.length;

          appointments.forEach((appointment) => {
            if (appointment.status === "waiting") {
              waitingPatients += 1;
            }

            if (appointment.patient?._id) {
              patientIds.add(appointment.patient._id);
            }
          });
        });

        setStats({
          doctors: doctors.length,
          appointments: totalAppointments,
          waiting: waitingPatients,
          patients: patientIds.size
        });
      } catch (error) {
        setError(error.message || "Unable to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const cards = [
    {
      title: "Today's Patients",
      value: stats.patients,
      description: "Patients with appointments today",
      icon: Users,
      path: "/appointments"
    },
    {
      title: "Total Doctors",
      value: stats.doctors,
      description: "Registered doctors",
      icon: Stethoscope,
      path: "/doctors"
    },
    {
      title: "Appointments",
      value: stats.appointments,
      description: "Today's appointments",
      icon: CalendarCheck,
      path: "/appointments"
    },
    {
      title: "Waiting Patients",
      value: stats.waiting,
      description: "Currently waiting",
      icon: Clock,
      path: "/queue"
    }
  ];

  const handleCardKeyDown = (event, path) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate(path);
    }
  };

  return (
    <div className="dashboard">
      <div className="page-heading">
        <div>
          <h1>Dashboard Overview</h1>
          <p>
            Monitor today's hospital appointments and patient queue.
          </p>
        </div>

        <span className="date-label">Hospital Management</span>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="stats-grid">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              className="stat-card stat-card-clickable"
              key={card.title}
              role="link"
              tabIndex={0}
              onClick={() => navigate(card.path)}
              onKeyDown={(event) => handleCardKeyDown(event, card.path)}
            >
              <div className="stat-top">
                <div className="stat-icon">
                  <Icon size={22} />
                </div>

                <ArrowUpRight size={18} className="stat-arrow" />
              </div>

              <h2>{loading ? "..." : card.value}</h2>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
          );
        })}
      </div>

      <div className="dashboard-bottom">
        <div
          className="welcome-card welcome-card-clickable"
          role="link"
          tabIndex={0}
          onClick={() => navigate("/future-enhancements")}
          onKeyDown={(event) =>
            handleCardKeyDown(event, "/future-enhancements")
          }
        >
          <div>
            <span>SEHATQUEUE ADMIN</span>

            <h2>
              Manage your hospital efficiently.
            </h2>

            <p>
              Monitor appointments, manage doctors and keep track of
              patient queues from one place.
            </p>
          </div>

          <Stethoscope size={75} />
        </div>

        <div className="activity-card">
          <h3>Today's Queue</h3>

          <p>
            Current patient activity across the hospital.
          </p>

          <div className="activity-status">
            <span></span>

            {loading
              ? "Loading queue data..."
              : `${stats.waiting} patient${
                  stats.waiting === 1 ? "" : "s"
                } currently waiting`}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
