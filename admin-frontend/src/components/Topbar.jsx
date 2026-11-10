
import { useEffect, useState } from "react";
import {
  Bell,
  Search,
  X,
  User,
  Stethoscope,
  CalendarDays,
  CheckCheck,
  Trash2,
  Clock
} from "lucide-react";

const API_URL = "http://localhost:5000";

function Topbar() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState({
    doctors: [],
    patients: [],
    appointments: []
  });
  const [loading, setLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("adminToken")}`
  });

  // get notifications
  const fetchNotifications = async () => {
    try {
      setNotificationLoading(true);
      setNotificationError("");

      const [notificationResponse, countResponse] = await Promise.all([
        fetch(`${API_URL}/api/notifications`, {
          headers: getHeaders()
        }),
        fetch(`${API_URL}/api/notifications/unread-count`, {
          headers: getHeaders()
        })
      ]);

      if (!notificationResponse.ok || !countResponse.ok) {
        throw new Error("Failed to load notifications");
      }

      const notificationData = await notificationResponse.json();
      const countData = await countResponse.json();

      setNotifications(notificationData);
      setUnreadCount(countData.count);
    } catch (error) {
      console.error("Notification error:", error);
      setNotificationError("Unable to load notifications.");
    } finally {
      setNotificationLoading(false);
    }
  };

  // load notifications when topbar opens
  useEffect(() => {
    fetchNotifications();
  }, []);

  // search data
  useEffect(() => {
    const searchData = async () => {
      if (!search.trim()) {
        setResults({
          doctors: [],
          patients: [],
          appointments: []
        });
        setSearchOpen(false);
        return;
      }

      try {
        setLoading(true);

        const headers = getHeaders();

        const [doctorResponse, patientResponse, appointmentResponse] =
          await Promise.all([
            fetch(
              `${API_URL}/api/admin/doctors/hospital/6ae1e0982680c6ba837e0f45`,
              { headers }
            ),
            fetch(`${API_URL}/api/admin/patients`, { headers }),
            fetch(`${API_URL}/api/admin/appointments`, { headers })
          ]);

        if (
          !doctorResponse.ok ||
          !patientResponse.ok ||
          !appointmentResponse.ok
        ) {
          throw new Error("Unable to load search data");
        }

        const doctors = await doctorResponse.json();
        const patients = await patientResponse.json();
        const appointments = await appointmentResponse.json();

        const query = search.toLowerCase().trim();

        setResults({
          doctors: doctors.filter((doctor) =>
            `${doctor.name} ${doctor.specialization}`
              .toLowerCase()
              .includes(query)
          ),
          patients: patients.filter((patient) =>
            `${patient.name} ${patient.email}`
              .toLowerCase()
              .includes(query)
          ),
          appointments: appointments.filter((appointment) =>
            `${appointment.patient?.name || ""}
            ${appointment.tokenNumber}
            ${appointment.status}
            ${appointment.doctor?.name || ""}`
              .toLowerCase()
              .includes(query)
          )
        });

        setSearchOpen(true);
      } catch (error) {
        console.error("Search error:", error);
        setResults({
          doctors: [],
          patients: [],
          appointments: []
        });
        setSearchOpen(true);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(searchData, 400);

    return () => clearTimeout(timer);
  }, [search]);

  // mark one notification as read
  const markAsRead = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/api/notifications/${id}/read`,
        {
          method: "PATCH",
          headers: getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      await fetchNotifications();
    } catch (error) {
      console.error(error);
      setNotificationError("Unable to update notification.");
    }
  };

  // mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/notifications/read-all`,
        {
          method: "PATCH",
          headers: getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error("Failed to mark all as read");
      }

      await fetchNotifications();
    } catch (error) {
      console.error(error);
      setNotificationError("Unable to update notifications.");
    }
  };

  // delete notification
  const deleteNotification = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/api/notifications/${id}`,
        {
          method: "DELETE",
          headers: getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete notification");
      }

      await fetchNotifications();
    } catch (error) {
      console.error(error);
      setNotificationError("Unable to delete notification.");
    }
  };

  const totalResults =
    results.doctors.length +
    results.patients.length +
    results.appointments.length;

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <header className="topbar">
      <div className="topbar-search">
        <Search size={19} />

        <input
          type="text"
          placeholder="Search doctors, patients, appointments..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onFocus={() => search.trim() && setSearchOpen(true)}
        />

        {search && (
          <button
            className="search-clear"
            onClick={() => setSearch("")}
          >
            <X size={16} />
          </button>
        )}

        {searchOpen && (
          <div className="search-results">
            {loading ? (
              <p>Searching...</p>
            ) : totalResults === 0 ? (
              <p>No matching results found.</p>
            ) : (
              <>
                {results.doctors.length > 0 && (
                  <div className="search-group">
                    <h4>Doctors</h4>
                    {results.doctors.map((doctor) => (
                      <div className="search-result" key={doctor._id}>
                        <Stethoscope size={17} />
                        <div>
                          <strong>{doctor.name}</strong>
                          <small>{doctor.specialization}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {results.patients.length > 0 && (
                  <div className="search-group">
                    <h4>Patients</h4>
                    {results.patients.map((patient) => (
                      <div className="search-result" key={patient._id}>
                        <User size={17} />
                        <div>
                          <strong>{patient.name}</strong>
                          <small>{patient.email}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {results.appointments.length > 0 && (
                  <div className="search-group">
                    <h4>Appointments</h4>
                    {results.appointments.map((appointment) => (
                      <div
                        className="search-result"
                        key={appointment._id}
                      >
                        <CalendarDays size={17} />
                        <div>
                          <strong>
                            {appointment.patient?.name || "Unknown patient"}
                            {" - "}Token #{appointment.tokenNumber}
                          </strong>
                          <small>
                            {appointment.doctor?.name || "Unknown doctor"}
                            {" · "}
                            {appointment.status}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="topbar-right">
        <div className="notification-wrapper">
          <button
            className="notification-button"
            onClick={() => {
              setNotificationOpen(!notificationOpen);
              if (!notificationOpen) {
                fetchNotifications();
              }
            }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="notification-count">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {notificationOpen && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <div>
                  <h3>Notifications</h3>
                  <small>{unreadCount} unread notifications</small>
                </div>

                <button
                  className="notification-close"
                  onClick={() => setNotificationOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              {unreadCount > 0 && (
                <button
                  className="mark-all-button"
                  onClick={markAllAsRead}
                >
                  <CheckCheck size={15} />
                  Mark all as read
                </button>
              )}

              <div className="notification-list">
                {notificationLoading ? (
                  <p className="notification-message">Loading notifications...</p>
                ) : notificationError ? (
                  <p className="notification-message notification-error">
                    {notificationError}
                  </p>
                ) : notifications.length === 0 ? (
                  <p className="notification-message">
                    No notifications yet.
                  </p>
                ) : (
                  notifications.map((notification) => (
                    <div
                      className={`notification-item ${
                        !notification.isRead ? "unread" : ""
                      }`}
                      key={notification._id}
                    >
                      <div className="notification-item-content">
                        <div className="notification-item-heading">
                          <strong>{notification.title}</strong>
                          {!notification.isRead && (
                            <span className="unread-dot"></span>
                          )}
                        </div>

                        <p>{notification.message}</p>

                        <small>
                          <Clock size={12} />
                          {formatDate(notification.createdAt)}
                        </small>
                      </div>

                      <div className="notification-actions">
                        {!notification.isRead && (
                          <button
                            title="Mark as read"
                            onClick={() => markAsRead(notification._id)}
                          >
                            <CheckCheck size={16} />
                          </button>
                        )}

                        <button
                          title="Delete notification"
                          onClick={() =>
                            deleteNotification(notification._id)
                          }
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                className="notification-refresh"
                onClick={fetchNotifications}
                disabled={notificationLoading}
              >
                Refresh notifications
              </button>
            </div>
          )}
        </div>

        <div className="admin-profile">
          <div className="admin-avatar">A</div>
          <div>
            <strong>Admin</strong>
            <small>Hospital Administrator</small>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
