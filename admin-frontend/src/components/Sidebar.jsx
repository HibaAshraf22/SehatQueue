import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Stethoscope,
  CalendarDays,
  Users,
  ListOrdered,
  Settings,
  LogOut,
  HeartPulse
} from "lucide-react";

function Sidebar() {
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
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <HeartPulse size={25} />
        </div>
        <div>
          <h2>SehatQueue</h2>
          <span>ADMIN PANEL</span>
        </div>
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