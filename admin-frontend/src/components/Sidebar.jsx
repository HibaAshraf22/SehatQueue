
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Stethoscope,
  CalendarDays,
  Users,
  ListOrdered,
  Settings,
  LogOut,
  HeartPulse,
  X
} from "lucide-react";

function Sidebar({ isOpen, onClose }) {
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    window.location.href = "/login";
  };

  const menuItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Doctors", path: "/doctors", icon: Stethoscope },
    { name: "Appointments", path: "/appointments", icon: CalendarDays },
    { name: "Patients", path: "/patients", icon: Users },
    { name: "Queue Management", path: "/queue", icon: ListOrdered },
    { name: "Settings", path: "/settings", icon: Settings }
  ];

  return (
    <aside className={`sidebar ${isOpen ? "mobile-open" : ""}`}>
      <div className="brand">
        <div className="brand-icon">
          <HeartPulse size={25} />
        </div>

        <div>
          <h2>SehatQueue</h2>
          <span>ADMIN PANEL</span>
        </div>

        <button className="mobile-sidebar-close" onClick={onClose}>
          <X size={22} />
        </button>
      </div>

      <div className="sidebar-label">MAIN MENU</div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              to={item.path}
              key={item.name}
              end={item.path === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              <Icon size={19} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <button className="logout-button" onClick={handleLogout}>
        <LogOut size={19} />
        <span>Logout</span>
      </button>
    </aside>
  );
}

export default Sidebar;
