
import { Navigate, Route, Routes } from "react-router-dom";
import { useState } from "react";

import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Doctors from "./pages/Doctors";
import Appointments from "./pages/Appointments";
import Patients from "./pages/Patients.jsx";
import Queue from "./pages/Queue.jsx";
import Settings from "./pages/Settings.jsx";
import FutureEnhancements from "./pages/FutureEnhancements";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("adminToken"))
  );

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (!isLoggedIn) {
    return (
      <Routes>
        <Route
          path="/login"
          element={<Login setIsLoggedIn={setIsLoggedIn} />}
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-layout">
      <button
        className="mobile-menu-button"
        onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      >
        ☰
      </button>

      <div
        className={`mobile-sidebar-overlay ${
          mobileSidebarOpen ? "show" : ""
        }`}
        onClick={() => setMobileSidebarOpen(false)}
      />

      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        onLogout={() => setIsLoggedIn(false)}
      />

      <div className="main-section">
        <Topbar />

        <main className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/queue" element={<Queue />} />
            <Route path="/settings" element={<Settings />} />
            <Route
              path="/future-enhancements"
              element={<FutureEnhancements />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
