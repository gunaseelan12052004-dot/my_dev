import React, { useState, useEffect } from "react";
import "./DoctorDashboard.css";
import { useNavigate } from "react-router-dom";
import axios from 'axios';


const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState("dashboard"); // default dashboard

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []); // empty dependency – page load aana once mattum run aagum

  
  // Logout function (simple-a)
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/DoctorLogin"); 
  };

  // Loading state or no user irundha
  if (!user) {
    return <div className="text-center mt-5">Loading doctor details...</div>;
  }

  return (
    <div className="dashboard-container">

      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="admin-profile text-center">
          <div className="admin-avatar">D</div> {/* D for Doctor */}
          <h5 className="mt-2">Doctor Panel</h5>
          <small>Dr. {user.name}</small>
        </div>

        <div className="sidebar-menu">
          <div
            className={`menu-card ${activeSection === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveSection("dashboard")}
          >
            📊 Dashboard
          </div>

          <div
            className={`menu-card ${activeSection === "appointments" ? "active" : ""}`}
            onClick={() => setActiveSection("appointments")}
          >
            🗓️ Appointments
          </div>

          <div
            className={`menu-card ${activeSection === "patients" ? "active" : ""}`}
            onClick={() => setActiveSection("patients")}
          >
            🧑 Patients
          </div>

          <div
            className={`menu-card ${activeSection === "profile" ? "active" : ""}`}
            onClick={() => setActiveSection("profile")}
          >
            👤 Profile
          </div>

          <div className="menu-card" onClick={handleLogout}>
            🚪 Logout
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">

        {/* Top Navbar – Dynamic name */}
        <div className="topbar shadow-sm d-flex justify-content-between align-items-center px-4 py-3">
          <h5>Welcome, Dr. {user.name} 👨‍⚕️</h5>
          <button 
            className="btn btn-danger btn-sm" 
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        <div className="container-fluid mt-4">

          {/* Stats Cards – ippo hardcoded, next-a backend-la dynamic pannalam */}
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card stat-card">
                <h6>Total Patients</h6>
                <h3>128</h3>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card stat-card">
                <h6>Today's Appointments</h6>
                <h3>12</h3>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card stat-card">
                <h6>Pending Reports</h6>
                <h3>5</h3>
              </div>
            </div>
          </div>

          {/* Recent Appointments – hardcoded, next-a API call panni dynamic pannalam */}
          <div className="card mt-5 p-3 shadow-sm">
            <h5 className="mb-3">Recent Appointments</h5>
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>Patient Name</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Ramesh</td>
                    <td>26-02-2026</td>
                    <td>10:30 AM</td>
                    <td><span className="badge bg-success">Completed</span></td>
                  </tr>
                  <tr>
                    <td>Suresh</td>
                    <td>26-02-2026</td>
                    <td>11:30 AM</td>
                    <td><span className="badge bg-warning">Pending</span></td>
                  </tr>
                  <tr>
                    <td>Karthik</td>
                    <td>27-02-2026</td>
                    <td>09:00 AM</td>
                    <td><span className="badge bg-danger">Cancelled</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;