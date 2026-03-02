import React, { useState, useEffect } from "react";
import "./AdminDashboard.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const navigate = useNavigate();
  const [doctorIdGenerated, setDoctorIdGenerated] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [editingDoctor, setEditingDoctor] = useState(null); // For edit functionality
  const [searchPatient, setSearchPatient] = useState(""); // <--- ADD THIS LINE!
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [doctorFilter, setDoctorFilter] = useState("all"); // 'all', 'active', 'inactive'
  const [showDownloadForm, setShowDownloadForm] = useState(false);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [staffFilter, setStaffFilter] = useState("all"); // 'all', 'active', 'inactive', 'onLeave'
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [staffByDepartment, setStaffByDepartment] = useState([]);

  const [downloadFilters, setDownloadFilters] = useState({
    role: "all", // 'all', 'doctor', 'nurse', 'staff'
    status: "all", // 'all', 'active', 'inactive', 'leave'
    department: "all", // 'all', 'cardiology', etc
    format: "csv", // 'csv', 'excel'
  });

  // Available options for dropdowns
  const roleOptions = [
    { value: "all", label: "All Roles" },
    { value: "doctor", label: "Doctors" },
    { value: "nurse", label: "Nurses" },
    { value: "attender", label: "Attenders" },
    { value: "technician", label: "Technicians" },
    { value: "receptionist", label: "Receptionists" },
    { value: "pharmacist", label: "Pharmacists" },
    { value: "staff", label: "Other Staff" },
  ];

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "leave", label: "On Leave" },
    { value: "pending", label: "Pending" },
  ];

  const departmentOptions = [
    { value: "all", label: "All Departments" },
    { value: "Cardiology", label: "Cardiology" },
    { value: "Dermatology", label: "Dermatology" },
    { value: "Neurology", label: "Neurology" },
    { value: "Gynecology", label: "Gynecology" },
    { value: "Orthopedics", label: "Orthopedics" },
    { value: "Pediatrics", label: "Pediatrics" },
    { value: "General Medicine", label: "General Medicine" },
    { value: "ENT", label: "ENT" },
    { value: "Ophthalmology", label: "Ophthalmology" },
    { value: "Emergency", label: "Emergency" },
    { value: "ICU", label: "ICU" },
    { value: "Lab", label: "Lab" },
    { value: "Pharmacy", label: "Pharmacy" },
    { value: "Front Desk", label: "Front Desk" },
    { value: "Administration", label: "Administration" },
  ];

  // Filter data based on download options
  const getFilteredDataForDownload = () => {
    let data = [];

    // Combine doctors and staff based on role filter
    if (downloadFilters.role === "all" || downloadFilters.role === "doctor") {
      data = [
        ...data,
        ...doctors.map((d) => ({
          id: d.doctor_id,
          name: `Dr. ${d.name}`,
          role: "Doctor",
          specialization: d.specialization,
          department: d.specialization,
          email: d.email,
          phone: d.phone || "-",
          status: d.status,
          type: "doctor",
        })),
      ];
    }

    if (downloadFilters.role === "all" || downloadFilters.role !== "doctor") {
      const staffFiltered = staff.map((s) => ({
        id: s.staff_id,
        name: s.name,
        role: s.role,
        specialization: s.role,
        department: s.department || "General",
        email: s.email,
        phone: s.phone || "-",
        status: s.status,
        type: "staff",
      }));
      data = [...data, ...staffFiltered];
    }

    // Apply status filter
    if (downloadFilters.status !== "all") {
      let statusMap = {
        active: "Active",
        inactive: "Inactive",
        leave: "On Leave",
        pending: "Pending",
      };
      const targetStatus = statusMap[downloadFilters.status];
      data = data.filter(
        (item) => item.status.toLowerCase() === targetStatus.toLowerCase(),
      );
    }

    // Apply department filter
    if (downloadFilters.department !== "all") {
      data = data.filter(
        (item) =>
          item.department === downloadFilters.department ||
          item.specialization === downloadFilters.department,
      );
    }

    return data;
  };

  // Advanced download with filters
  const handleAdvancedDownload = () => {
    const filteredData = getFilteredDataForDownload();

    if (filteredData.length === 0) {
      alert("No data found for selected filters da mapla! 😕");
      return;
    }

    // Create CSV
    let csv =
      "ID,Name,Role,Specialization/Department,Email,Phone,Status,Type\n";

    filteredData.forEach((item) => {
      csv += `${item.id},${item.name},${item.role},${item.department},${item.email},${item.phone},${item.status},${item.type}\n`;
    });

    // Add summary
    csv += "\n";
    csv += `Download Summary,,,${new Date().toLocaleString()}\n`;
    csv += `Total Records,,,${filteredData.length}\n`;
    csv += `Filter Applied - Role: ${downloadFilters.role}, Status: ${downloadFilters.status}, Department: ${downloadFilters.department}\n`;

    // Download
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Hospital_Data_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    setShowDownloadForm(false);
    alert(`✅ ${filteredData.length} records downloaded da mapla!`);
  };

  const [formData, setFormData] = useState({
    name: "",
    specialization: "",
    email: "",
    phone: "",
    password: "",
    status: "Active",
    doctor_id: "",
  });
  const [staff, setStaff] = useState([]);
  const [staffStats, setStaffStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    onLeave: 0,
    byRole: [],
    byDepartment: [],
  });

  const [showStaffForm, setShowStaffForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [staffByRole, setStaffByRole] = useState([]);
  const [staffFormData, setStaffFormData] = useState({
    name: "",
    role: "",
    department: "",
    email: "",
    phone: "",
    salary: "",
    join_date: "",
    status: "Active",
  });

  // Filter doctors based on status
  const filterDoctorsByStatus = (status) => {
    setDoctorFilter(status);
    if (status === "all") {
      setFilteredDoctors(doctors);
    } else if (status === "active") {
      setFilteredDoctors(doctors.filter((d) => d.status === "Active"));
    } else if (status === "inactive") {
      setFilteredDoctors(doctors.filter((d) => d.status !== "Active"));
    }
    setActiveSection("doctorList");
  };
  useEffect(() => {
    fetchDoctors();
    fetchAppointmentStats();
    fetchStaff();
    fetchStaffStats();
  }, []);

  useEffect(() => {
    setFilteredDoctors(doctors);
  }, [doctors]);

  // Fetch all doctors
  const fetchDoctors = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/doctors");
      if (response.data.success) {
        setDoctors(response.data.doctors);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/DoctorLogin");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generateDoctorId = async () => {
    if (doctorIdGenerated) return;

    try {
      const response = await axios.get(
        "http://localhost:5000/api/doctors/max-id",
      );
      const lastId = response.data.maxId || "DOC000";
      const num = parseInt(lastId.replace("DOC", "")) + 1;
      const newId = `DOC${String(num).padStart(3, "0")}`;

      setFormData((prev) => ({ ...prev, doctor_id: newId }));
      setDoctorIdGenerated(true);
    } catch (err) {
      console.error("ID generate error:", err);
      const randomNum = Math.floor(100 + Math.random() * 900);
      setFormData((prev) => ({ ...prev, doctor_id: `DOC${randomNum}` }));
      setDoctorIdGenerated(true);
    }
  };

  // Add new doctor
  const handleAddDoctor = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:5000/api/doctors",
        formData,
      );

      if (response.data.success) {
        alert("Doctor Added Successfully da mapla! 🎉");
        setShowForm(false);
        setDoctorIdGenerated(false);
        setFormData({
          name: "",
          specialization: "",
          email: "",
          phone: "",
          password: "",
          status: "Active",
          doctor_id: "",
        });

        // Refresh doctors list - count automatically update aagum
        await fetchDoctors();

        // Doctor list section ku poidu
        setActiveSection("doctorList");
      }
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Server error da mapla! 😭");
    }
  };

  // Delete doctor
  const handleDeleteDoctor = async (doctorIdentifier) => {
    if (window.confirm("Sure ah delete pannanumaa da mapla?")) {
      try {
        // Doctor object ah pass pannu, field check panni correct ah edukalam
        let deleteId;

        // Namma pass pannathu doctor object ah illa ID ah nu check pannu
        if (typeof doctorIdentifier === "object") {
          // Object ah vandha - id use pannu
          deleteId = doctorIdentifier.id;
        } else {
          // String ah vandha - adhu primary key id nu assume pannu
          deleteId = doctorIdentifier;
        }

        // console.log("Deleting doctor with ID:", deleteId); // Debug pannu

        const response = await axios.delete(
          `http://localhost:5000/api/doctors/${deleteId}`,
        );

        if (response.data.success) {
          alert("Doctor deleted successfully da mapla! 🗑️");
          await fetchDoctors();
        }
      } catch (error) {
        console.error("Error deleting doctor:", error);
        alert("Delete panna mudiyala da mapla! 😭");
      }
    }
  };

  // Edit doctor - set form for editing
  const handleEditDoctor = (doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      name: doctor.name,
      specialization: doctor.specialization,
      email: doctor.email,
      phone: doctor.phone || "",
      password: "", // Password field empty for security
      status: doctor.status,
      doctor_id: doctor.doctor_id,
    });
    setDoctorIdGenerated(true); // ID already irukku
    setShowForm(true);
  };

  // Update doctor
  const handleUpdateDoctor = async (e) => {
    e.preventDefault();

    try {
      // If password is empty, remove it from update data
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }

      const response = await axios.put(
        `http://localhost:5000/api/doctors/${editingDoctor.doctor_id}`,
        updateData,
      );

      if (response.data.success) {
        alert("Doctor Updated Successfully da mapla! ✨");
        setShowForm(false);
        setEditingDoctor(null);
        setDoctorIdGenerated(false);
        setFormData({
          name: "",
          specialization: "",
          email: "",
          phone: "",
          password: "",
          status: "Active",
          doctor_id: "",
        });

        // Refresh doctors list
        await fetchDoctors();
        setActiveSection("doctorList");
      }
    } catch (error) {
      console.error("Error updating doctor:", error);
      alert("Didn't Update  😭");
    }
  };

  // CSV Download function
  // Simple CSV Download function - Just basic info
  const downloadDoctorsCSV = () => {
    // Simple headers
    let csv = "Doctor ID,Name,Specialization,Email,Phone,Status\n";

    // Simple rows
    doctors.forEach((doctor) => {
      csv += `${doctor.doctor_id},Dr. ${doctor.name},${doctor.specialization},${doctor.email},${doctor.phone || "-"},${doctor.status}\n`;
    });

    // Create and download
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Doctors_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    alert(`${doctors.length} doctors exported da mapla! ✅`);
  };

  // Calculate stats
  const totalDoctors = doctors.length;
  const activeDoctors = doctors.filter((d) => d.status === "Active").length;
  const inactiveDoctors = doctors.filter((d) => d.status !== "Active").length;

  const patientData = [
    { id: "PT001", name: "Rahul", amount: "12,500" },
    { id: "PT002", name: "Aishwarya", amount: "18,000" },
    { id: "PT003", name: "Karthik", amount: "25,300" },
    { id: "PT004", name: "Meena", amount: "10,200" },
    { id: "PT005", name: "Vijay", amount: "30,000" },
    { id: "PT006", name: "Sneha", amount: "8,900" },
    { id: "PT007", name: "Arun", amount: "15,750" },
    { id: "PT008", name: "Divya", amount: "22,600" },
    { id: "PT009", name: "Samuel", amount: "19,450" },
    { id: "PT010", name: "Keerthana", amount: "27,000" },
  ];

  const [search, setSearch] = useState("");

  const filteredPatients = patientData.filter(
    (p) =>
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const [appointmentStats, setAppointmentStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    todayAppointmentsList: [],
    allAppointments: [],
  });

  // Fetch appointments count
  // Fetch appointments count
  // Fetch appointments count
  const fetchAppointmentStats = async () => {
    try {
      // Today's appointments count
      const todayCountRes = await axios.get(
        "http://localhost:5000/api/appointments/today/count",
      );

      // Today's appointments LIST
      const todayListRes = await axios.get(
        "http://localhost:5000/api/appointments/today",
      );

      // Total patients (appointments) count
      const totalRes = await axios.get(
        "http://localhost:5000/api/appointments/total/count",
      );

      // All appointments for list view
      const allRes = await axios.get(
        "http://localhost:5000/api/appointments/all",
      );

      // Get all doctors for mapping
      const doctorsRes = await axios.get("http://localhost:5000/api/doctors");
      const doctorsList = doctorsRes.data.doctors || [];

      // Create a map of doctor_id to doctor name
      const doctorMap = {};
      doctorsList.forEach((doc) => {
        doctorMap[doc.doctor_id] = `Dr. ${doc.name}`;
      });

      // Add doctor names to appointments
      const allAppointmentsWithDoctor = (allRes.data.appointments || []).map(
        (app) => ({
          ...app,
          doctorName: doctorMap[app.doctor] || "Not Assigned",
        }),
      );

      const todayAppointmentsWithDoctor = (
        todayListRes.data.appointments || []
      ).map((app) => ({
        ...app,
        doctorName: doctorMap[app.doctor] || "Not Assigned",
      }));

      setAppointmentStats({
        totalPatients: totalRes.data.count || 0,
        todayAppointments: todayCountRes.data.count || 0,
        todayAppointmentsList: todayAppointmentsWithDoctor,
        allAppointments: allAppointmentsWithDoctor,
      });
    } catch (error) {
      console.error("Error fetching appointment stats:", error);

      // Fallback
      if (error.response?.status === 404) {
        console.log("Today endpoint not found, fetching all and filtering...");
        try {
          const allRes = await axios.get(
            "http://localhost:5000/api/appointments/all",
          );
          const today = new Date().toISOString().split("T")[0];
          const todayList =
            allRes.data.appointments?.filter((app) => app.date === today) || [];

          // Get doctors for mapping
          const doctorsRes = await axios.get(
            "http://localhost:5000/api/doctors",
          );
          const doctorsList = doctorsRes.data.doctors || [];
          const doctorMap = {};
          doctorsList.forEach((doc) => {
            doctorMap[doc.doctor_id] = `Dr. ${doc.name}`;
          });

          const allAppointmentsWithDoctor = (
            allRes.data.appointments || []
          ).map((app) => ({
            ...app,
            doctorName: doctorMap[app.doctor] || "Not Assigned",
          }));

          const todayAppointmentsWithDoctor = todayList.map((app) => ({
            ...app,
            doctorName: doctorMap[app.doctor] || "Not Assigned",
          }));

          setAppointmentStats({
            totalPatients: allRes.data.appointments?.length || 0,
            todayAppointments: todayList.length,
            todayAppointmentsList: todayAppointmentsWithDoctor,
            allAppointments: allAppointmentsWithDoctor,
          });
        } catch (err) {
          console.error("Fallback also failed:", err);
        }
      }
    }
  };
  // Fetch on component mount and after new booking
  useEffect(() => {
    fetchDoctors();
    fetchAppointmentStats();
  }, []);

  // Call this after successful booking
  const refreshStats = () => {
    fetchDoctors();
    fetchAppointmentStats();
  };

  const fetchStaff = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/staff");
      if (response.data.success) {
        setStaff(response.data.staff);
        setFilteredStaff(response.data.staff); // Important!
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    }
  };

  // Fetch staff stats
  const fetchStaffStats = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/staff/stats");
      if (response.data.success) {
        setStaffStats(response.data.stats);
      }
    } catch (error) {
      console.error("Error fetching staff stats:", error);
    }
  };

  // Fetch staff by role
  const fetchStaffByRole = async (role) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/staff/role/${role}`,
      );
      if (response.data.success) {
        setStaffByRole(response.data.staff);
        setSelectedRole(role);
      }
    } catch (error) {
      console.error("Error fetching staff by role:", error);
    }
  };

  // Handle staff form change
  const handleStaffChange = (e) => {
    const { name, value } = e.target;
    setStaffFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Add staff
  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:5000/api/staff",
        staffFormData,
      );
      if (response.data.success) {
        alert("Staff added successfully da mapla! 🎉");
        setShowStaffForm(false);
        setStaffFormData({
          name: "",
          role: "",
          department: "",
          email: "",
          phone: "",
          salary: "",
          join_date: "",
          status: "Active",
        });
        fetchStaff();
        fetchStaffStats();
      }
    } catch (error) {
      console.error("Error adding staff:", error);
      alert(error.response?.data?.message || "Error adding staff da mapla! 😭");
    }
  };

  const handleEditStaff = (staffMember) => {
    setEditingStaff(staffMember);
    setStaffFormData({
      name: staffMember.name,
      role: staffMember.role,
      department: staffMember.department || "",
      email: staffMember.email,
      phone: staffMember.phone || "",
      salary: staffMember.salary || "",
      join_date: staffMember.join_date
        ? staffMember.join_date.split("T")[0]
        : "",
      status: staffMember.status,
    });
    setShowStaffForm(true);
  };

  // Update staff
  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `http://localhost:5000/api/staff/${editingStaff.id}`,
        staffFormData,
      );
      if (response.data.success) {
        alert("Staff updated successfully da mapla! ✨");
        setShowStaffForm(false);
        setEditingStaff(null);
        setStaffFormData({
          name: "",
          role: "",
          department: "",
          email: "",
          phone: "",
          salary: "",
          join_date: "",
          status: "Active",
        });
        fetchStaff();
        fetchStaffStats();
        if (selectedRole) {
          fetchStaffByRole(selectedRole);
        }
      }
    } catch (error) {
      console.error("Error updating staff:", error);
      alert("Error updating staff da mapla! 😭");
    }
  };

  // Delete staff
  const handleDeleteStaff = async (id) => {
    if (window.confirm("Sure ah delete pannanumaa da mapla?")) {
      try {
        const response = await axios.delete(
          `http://localhost:5000/api/staff/${id}`,
        );
        if (response.data.success) {
          alert("Staff deleted successfully da mapla! 🗑️");
          fetchStaff();
          fetchStaffStats();
          if (selectedRole) {
            fetchStaffByRole(selectedRole);
          }
        }
      } catch (error) {
        console.error("Error deleting staff:", error);
        alert("Delete panna mudiyala da mapla! 😭");
      }
    }
  };

  // Load staff on mount
  useEffect(() => {
    fetchDoctors();
    fetchAppointmentStats();
    fetchStaff();
    fetchStaffStats();
  }, []);
  useEffect(() => {
    setFilteredStaff(staff);
  }, [staff]);

  useEffect(() => {
    // Apply filter whenever staffFilter changes
    if (staffFilter === "all") {
      setFilteredStaff(staff);
    } else if (staffFilter === "active") {
      setFilteredStaff(staff.filter((s) => s.status === "Active"));
    } else if (staffFilter === "inactive") {
      setFilteredStaff(staff.filter((s) => s.status === "Inactive"));
    } else if (staffFilter === "onLeave") {
      setFilteredStaff(staff.filter((s) => s.status === "On Leave"));
    }
  }, [staffFilter, staff]);

  // Fetch staff by department
  // Fetch staff by department
  const fetchStaffByDepartment = (department) => {
    const deptStaff = staff.filter((s) => s.department === department);
    setStaffByDepartment(deptStaff);
    setSelectedDepartment(department);
    setSelectedRole(null); // Clear role filter
    setStaffFilter("department");
    setStaffByRole([]); // Clear role filtered data
  };

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="admin-profile text-center">
          <div className="admin-avatar">A</div>
          <h5 className="mt-2">Admin Panel</h5>
        </div>

        <div className="sidebar-menu">
          <div
            className={`menu-card ${activeSection === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveSection("dashboard")}
          >
            📊 Admin Dashboard
          </div>

          <div
            className={`menu-card ${activeSection === "doctors" ? "active" : ""}`}
            onClick={() => setActiveSection("doctors")}
          >
            🧑‍⚕️ Doctors
          </div>

          <div
            className={`menu-card ${activeSection === "staffList" ? "active" : ""}`}
            onClick={() => setActiveSection("staffList")}
          >
            👩‍💼 Staff
          </div>

          <div
            className={`menu-card ${activeSection === "patientList" ? "active" : ""}`}
            onClick={() => setActiveSection("patientList")}
          >
            🧑 Patients
          </div>

          <div
            className={`menu-card ${activeSection === "appointmentsList" ? "active" : ""}`}
            onClick={() => setActiveSection("appointmentsList")}
          >
            📅 Appointments
          </div>
          <div className="menu-card">⚙️ Settings</div>
          <div className="menu-card">👤 Profile</div>
          <div className="menu-card" onClick={handleLogout}>
            🚪 Logout
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main">
        <div className="admin-topbar shadow-sm">
          <h5>Welcome Admin 👨‍💼</h5>
        </div>

        <div className="container-fluid mt-4">
          {/* 🔥 ADMIN DASHBOARD SECTION - Count real-time ah update aagum! */}
          {activeSection === "dashboard" && (
            <>
              <div className="mb-3">
                <button
                  className="btn btn-info"
                  onClick={() => setShowDownloadForm(!showDownloadForm)}
                >
                  📥 Advanced Download
                </button>
              </div>
              {showDownloadForm && (
                <div className="card p-4 mb-4 shadow">
                  <h4 className="mb-3">📊 Advanced Download</h4>
                  <div className="row g-3">
                    <div className="col-md-3">
                      <label className="form-label">Select Role</label>
                      <select
                        className="form-select"
                        value={downloadFilters.role}
                        onChange={(e) =>
                          setDownloadFilters({
                            ...downloadFilters,
                            role: e.target.value,
                          })
                        }
                      >
                        {roleOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label">Select Status</label>
                      <select
                        className="form-select"
                        value={downloadFilters.status}
                        onChange={(e) =>
                          setDownloadFilters({
                            ...downloadFilters,
                            status: e.target.value,
                          })
                        }
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label">Select Department</label>
                      <select
                        className="form-select"
                        value={downloadFilters.department}
                        onChange={(e) =>
                          setDownloadFilters({
                            ...downloadFilters,
                            department: e.target.value,
                          })
                        }
                      >
                        {departmentOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label">Format</label>
                      <select
                        className="form-select"
                        value={downloadFilters.format}
                        onChange={(e) =>
                          setDownloadFilters({
                            ...downloadFilters,
                            format: e.target.value,
                          })
                        }
                      >
                        <option value="csv">CSV</option>
                        <option value="excel">Excel (CSV)</option>
                      </select>
                    </div>

                    <div className="col-12 mt-3">
                      <button
                        className="btn btn-success me-2"
                        onClick={handleAdvancedDownload}
                      >
                        ⬇️ Download Now
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setShowDownloadForm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div className="row g-4">
                <div className="col-md-3">
                  <div
                    className="card stat-card"
                    onClick={() => filterDoctorsByStatus("all")}
                  >
                    <h6>Total Doctors</h6>
                    <h3>{totalDoctors}</h3>
                  </div>
                </div>

                <div className="col-md-3">
                  <div
                    className="card stat-card"
                    onClick={() => {
                      setActiveSection("staffList");
                      setSelectedRole(null); // Reset any role filter
                      setStaffByRole([]); // Clear role filtered data
                    }}
                  >
                    <h6>Total Staff</h6>
                    <h3>{staffStats.total}</h3>
                  </div>
                </div>
                <div className="col-md-3">
                  <div
                    className="card stat-card"
                    onClick={() => setActiveSection("totalAmount")}
                  >
                    <h6>Total Revenue</h6>
                    <h3>₹50,000</h3>
                  </div>
                </div>

                <div className="col-md-3">
                  <div
                    className="card stat-card"
                    onClick={() => setActiveSection("patientList")}
                  >
                    <h6>Total Patients</h6>
                    <h3>{appointmentStats.totalPatients}</h3>{" "}
                    {/* Dynamic count */}
                  </div>
                </div>
              </div>

              <div className="row g-4 mt-2">
                <div className="col-md-3">
                  <div
                    className="card stat-card"
                    onClick={() => filterDoctorsByStatus("active")}
                  >
                    <h6>Active Doctors</h6>
                    <h3>{activeDoctors}</h3>
                  </div>
                </div>

                <div className="col-md-3">
                  <div
                    className="card stat-card"
                    onClick={() => filterDoctorsByStatus("inactive")}
                  >
                    <h6>Inactive Doctors</h6>
                    <h3>{inactiveDoctors}</h3>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* DOCTORS SECTION */}
          {/* DOCTORS SECTION */}
          {activeSection === "doctors" && (
            <>
              {/* Stats Cards */}
              <div className="row g-4">
                <div className="col-md-4">
                  <div
                    className="card stat-card"
                    onClick={() => {
                      filterDoctorsByStatus("all");
                      setActiveSection("doctorList");
                    }}
                  >
                    <h6>Total Doctors</h6>
                    <h3>{totalDoctors}</h3>
                  </div>
                </div>

                <div className="col-md-4">
                  <div
                    className="card stat-card"
                    onClick={() => {
                      filterDoctorsByStatus("active");
                      setActiveSection("doctorList");
                    }}
                  >
                    <h6>Active Doctors</h6>
                    <h3>{activeDoctors}</h3>
                  </div>
                </div>

                <div className="col-md-4">
                  <div
                    className="card stat-card"
                    onClick={() => {
                      filterDoctorsByStatus("inactive");
                      setActiveSection("doctorList");
                    }}
                  >
                    <h6>Inactive Doctors</h6>
                    <h3>{inactiveDoctors}</h3>
                  </div>
                </div>
              </div>

              {/* Department-wise Doctors Cards */}
              <div className="row g-3 mt-4 mb-4">
                <div className="col-12">
                  <h4 className="mb-3">📊 Department-wise Doctors</h4>
                </div>
                {Object.entries(
                  doctors.reduce((acc, doctor) => {
                    acc[doctor.specialization] =
                      (acc[doctor.specialization] || 0) + 1;
                    return acc;
                  }, {}) || {},
                ).map(([dept, count]) => (
                  <div className="col-md-2 col-sm-4" key={dept}>
                    <div
                      className="card text-white p-2 text-center"
                      style={{
                        background:
                          "linear-gradient(135deg, #3498db 0%, #2980b9 100%)",
                        cursor: "pointer",
                        transition: "transform 0.2s",
                      }}
                      onClick={() => {
                        // Filter doctors by this department
                        const deptDoctors = doctors.filter(
                          (d) => d.specialization === dept,
                        );
                        setFilteredDoctors(deptDoctors);
                        setDoctorFilter(dept); // Set filter as department name
                        setActiveSection("doctorList");
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.transform = "scale(1.05)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                      }
                    >
                      <h6 className="mb-1">{dept}</h6>
                      <h3 className="mb-0">{count}</h3>
                      <small>Doctors</small>
                    </div>
                  </div>
                ))}
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <h4 className="mt-3">Doctors Management</h4>
                <button
                  className="btn btn-primary mt-3"
                  onClick={() => {
                    setEditingDoctor(null);
                    setFormData({
                      name: "",
                      specialization: "",
                      email: "",
                      phone: "",
                      password: "",
                      status: "Active",
                      doctor_id: "",
                    });
                    setDoctorIdGenerated(false);
                    setShowForm(true);
                  }}
                >
                  + Add New Doctor
                </button>
              </div>

              {/* Add/Edit Form */}
              {showForm && (
                <div className="card mt-4 p-4 shadow-sm">
                  <h5>{editingDoctor ? "Edit Doctor" : "Add New Doctor"}</h5>

                  <form
                    onSubmit={
                      editingDoctor ? handleUpdateDoctor : handleAddDoctor
                    }
                  >
                    <div className="row g-3">
                      <div className="col-md-4">
                        <input
                          type="text"
                          name="name"
                          placeholder="Doctor Name"
                          className="form-control"
                          value={formData.name}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="col-md-4">
                        <select
                          name="specialization"
                          className="form-select"
                          value={formData.specialization}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select Specialization</option>
                          <option value="Cardiology">Cardiology</option>
                          <option value="Dermatology">Dermatology</option>
                          <option value="Neurology">Neurology</option>
                          <option value="Gynecology">Gynecology</option>
                          <option value="Orthopedics">Orthopedics</option>
                          <option value="Pediatrics">Pediatrics</option>
                          <option value="General Medicine">
                            General Medicine
                          </option>
                          <option value="ENT">ENT</option>
                          <option value="Ophthalmology">Ophthalmology</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="col-md-4">
                        <div className="input-group">
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={generateDoctorId}
                            disabled={doctorIdGenerated || editingDoctor}
                          >
                            Generate Doctor ID
                          </button>
                          <input
                            type="text"
                            name="doctor_id"
                            className="form-control"
                            placeholder="Auto generated ID"
                            value={formData.doctor_id}
                            readOnly
                          />
                        </div>
                      </div>

                      <div className="col-md-4">
                        <input
                          type="email"
                          name="email"
                          placeholder="Email"
                          className="form-control"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="col-md-4">
                        <input
                          type="tel"
                          name="phone"
                          placeholder="Phone Number"
                          className="form-control"
                          value={formData.phone}
                          onChange={handleChange}
                          pattern="[0-9]{10}"
                          title="10 digit phone number"
                        />
                      </div>

                      <div className="col-md-4">
                        <input
                          type="password"
                          name="password"
                          placeholder={
                            editingDoctor
                              ? "Leave empty to keep same"
                              : "Password"
                          }
                          className="form-control"
                          value={formData.password}
                          onChange={handleChange}
                          required={!editingDoctor}
                        />
                        {editingDoctor && (
                          <small className="text-muted">
                            Leave empty to keep current password
                          </small>
                        )}
                      </div>

                      <div className="col-md-3">
                        <select
                          name="status"
                          className="form-select"
                          value={formData.status}
                          onChange={handleChange}
                        >
                          <option value="Active">Active</option>
                          <option value="Pending">Pending</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>

                      <div className="col-12 mt-4">
                        <div className="d-flex gap-2">
                          <button
                            type="submit"
                            className="btn btn-success flex-grow-1"
                          >
                            {editingDoctor ? "Update Doctor" : "Save Doctor"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => {
                              setShowForm(false);
                              setEditingDoctor(null);
                              setDoctorIdGenerated(false);
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}

          {/* DOCTOR LIST SECTION with Delete and Edit buttons */}
          {/* DOCTOR LIST SECTION */}
          {/* DOCTOR LIST SECTION */}
          {activeSection === "doctorList" && (
            <div className="card mt-4 p-3 shadow-sm">
              <div className="d-flex justify-content-between align-items-center">
                <h4>
                  {doctorFilter === "all"
                    ? "All Doctors"
                    : doctorFilter === "active"
                      ? "Active Doctors"
                      : doctorFilter === "inactive"
                        ? "Inactive Doctors"
                        : `${doctorFilter} Department`}
                  (Total: {filteredDoctors.length})
                </h4>
                <div className="d-flex gap-2">
                  <button
                    className={`btn btn-sm ${doctorFilter === "all" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => {
                      filterDoctorsByStatus("all");
                      setFilteredDoctors(doctors);
                    }}
                  >
                    All
                  </button>
                  <button
                    className={`btn btn-sm ${doctorFilter === "active" ? "btn-success" : "btn-outline-success"}`}
                    onClick={() => filterDoctorsByStatus("active")}
                  >
                    Active
                  </button>
                  <button
                    className={`btn btn-sm ${doctorFilter === "inactive" ? "btn-danger" : "btn-outline-danger"}`}
                    onClick={() => filterDoctorsByStatus("inactive")}
                  >
                    Inactive
                  </button>
                  {/* In doctorList section, update the download button */}
                  <button
                    className="btn btn-primary btt1"
                    onClick={() => {
                      setEditingDoctor(null);
                      setShowForm(true);
                      setActiveSection("doctors");
                    }}
                  >
                    + Add Doctor
                  </button>
                </div>
              </div>

              <table className="table table-bordered mt-3">
                <thead>
                  <tr>
                    <th>Doctor ID</th>
                    <th>Name</th>
                    <th>Specialization</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDoctors.map((doctor) => (
                    <tr key={doctor.id}>
                      <td>{doctor.doctor_id}</td>
                      <td>Dr. {doctor.name}</td>
                      <td>
                        <span className="badge bg-info">
                          {doctor.specialization}
                        </span>
                      </td>
                      <td>{doctor.email}</td>
                      <td>{doctor.phone || "-"}</td>
                      <td>
                        <span
                          className={`badge bg-${doctor.status === "Active" ? "success" : doctor.status === "Pending" ? "warning" : "danger"}`}
                        >
                          {doctor.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-warning me-2"
                          onClick={() => {
                            handleEditDoctor(doctor);
                            setActiveSection("doctors");
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteDoctor(doctor)}
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* STAFF LIST SECTION */}
          {activeSection === "staffList" && (
            <div className="staff-management">
              {/* Header with Add Button */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Staff Management</h2>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setEditingStaff(null);
                    setStaffFormData({
                      name: "",
                      role: "",
                      department: "",
                      email: "",
                      phone: "",
                      salary: "",
                      join_date: "",
                      status: "Active",
                    });
                    setShowStaffForm(true);
                  }}
                >
                  + Add New Staff
                </button>
              </div>

              {/* Staff Stats Cards */}
              {/* Staff Stats Cards - Status Filter */}
              <div className="row g-3 mb-4">
                <div className="col-md-3">
                  <div
                    className={`card text-white p-3 ${staffFilter === "all" && !selectedRole && !selectedDepartment ? "border-white border-3" : ""}`}
                    style={{
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      cursor: "pointer",
                      transition: "transform 0.2s",
                    }}
                    onClick={() => {
                      setStaffFilter("all");
                      setSelectedRole(null);
                      setSelectedDepartment(null);
                      setStaffByRole([]);
                      setStaffByDepartment([]);
                      setFilteredStaff(staff);
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform = "scale(1.02)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.transform = "scale(1)")
                    }
                  >
                    <h6>Total Staff</h6>
                    <h2>{staffStats.total}</h2>
                    <small>Click to view all</small>
                  </div>
                </div>

                <div className="col-md-3">
                  <div
                    className={`card text-white p-3 ${staffFilter === "active" ? "border-white border-3" : ""}`}
                    style={{
                      background:
                        "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
                      cursor: "pointer",
                      transition: "transform 0.2s",
                    }}
                    onClick={() => {
                      setStaffFilter("active");
                      setSelectedRole(null);
                      setSelectedDepartment(null);
                      setStaffByRole([]);
                      setStaffByDepartment([]);
                      setFilteredStaff(
                        staff.filter((s) => s.status === "Active"),
                      );
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform = "scale(1.02)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.transform = "scale(1)")
                    }
                  >
                    <h6>Active Staff</h6>
                    <h2>{staffStats.active}</h2>
                    <small>Click to view active</small>
                  </div>
                </div>

                <div className="col-md-3">
                  <div
                    className={`card text-white p-3 ${staffFilter === "onLeave" ? "border-white border-3" : ""}`}
                    style={{
                      background:
                        "linear-gradient(135deg, #fad961 0%, #f76b1c 100%)",
                      cursor: "pointer",
                      transition: "transform 0.2s",
                    }}
                    onClick={() => {
                      setStaffFilter("onLeave");
                      setSelectedRole(null);
                      setSelectedDepartment(null);
                      setStaffByRole([]);
                      setStaffByDepartment([]);
                      setFilteredStaff(
                        staff.filter((s) => s.status === "On Leave"),
                      );
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform = "scale(1.02)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.transform = "scale(1)")
                    }
                  >
                    <h6>On Leave</h6>
                    <h2>{staffStats.onLeave}</h2>
                    <small>Click to view on leave</small>
                  </div>
                </div>

                <div className="col-md-3">
                  <div
                    className={`card text-white p-3 ${staffFilter === "inactive" ? "border-white border-3" : ""}`}
                    style={{
                      background:
                        "linear-gradient(135deg, #a8c0ff 0%, #3f2b96 100%)",
                      cursor: "pointer",
                      transition: "transform 0.2s",
                    }}
                    onClick={() => {
                      setStaffFilter("inactive");
                      setSelectedRole(null);
                      setSelectedDepartment(null);
                      setStaffByRole([]);
                      setStaffByDepartment([]);
                      setFilteredStaff(
                        staff.filter((s) => s.status === "Inactive"),
                      );
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform = "scale(1.02)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.transform = "scale(1)")
                    }
                  >
                    <h6>Inactive Staff</h6>
                    <h2>{staffStats.inactive}</h2>
                    <small>Click to view inactive</small>
                  </div>
                </div>
              </div>

              {/* Role-wise Cards - Role Filter */}
              <h4 className="mb-3">Staff by Role</h4>
              <div className="row g-3 mb-4">
                {staffStats.byRole?.map((role, index) => (
                  <div className="col-md-2" key={index}>
                    <div
                      className={`card role-card ${selectedRole === role.role ? "border-primary border-3" : ""}`}
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        const roleStaff = staff.filter(
                          (s) => s.role === role.role,
                        );
                        setStaffByRole(roleStaff);
                        setSelectedRole(role.role);
                        setSelectedDepartment(null);
                        setStaffFilter("role");
                        setStaffByDepartment([]);
                      }}
                    >
                      <div className="card-body text-center">
                        <h5 className="card-title">{role.role}</h5>
                        <h2 className="text-primary">{role.count}</h2>
                        <p className="card-text">Staff</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Department-wise Cards - Department Filter */}
              <h4 className="mb-3">Staff by Department</h4>
              <div className="row g-3 mb-4">
                {staffStats.byDepartment?.map((dept, index) => (
                  <div className="col-md-2" key={index}>
                    <div
                      className={`card ${selectedDepartment === dept.department ? "border-primary border-3" : "bg-light"}`}
                      style={{
                        cursor: "pointer",
                        transition: "transform 0.2s",
                      }}
                      onClick={() => {
                        const deptStaff = staff.filter(
                          (s) => s.department === dept.department,
                        );
                        setStaffByDepartment(deptStaff);
                        setSelectedDepartment(dept.department);
                        setSelectedRole(null);
                        setStaffFilter("department");
                        setStaffByRole([]);
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.transform = "scale(1.05)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                      }
                    >
                      <div className="card-body text-center">
                        <h6>{dept.department || "General"}</h6>
                        <h3
                          className={
                            selectedDepartment === dept.department
                              ? "text-primary"
                              : ""
                          }
                        >
                          {dept.count}
                        </h3>
                        <small className="text-muted">Click to view</small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add/Edit Staff Form */}
              {showStaffForm && (
                <div className="card p-4 mb-4">
                  <h4 className="mb-3">
                    {editingStaff ? "Edit Staff" : "Add New Staff"}
                  </h4>
                  <form
                    onSubmit={editingStaff ? handleUpdateStaff : handleAddStaff}
                  >
                    <div className="row g-3">
                      <div className="col-md-4">
                        <input
                          type="text"
                          name="name"
                          className="form-control"
                          placeholder="Full Name *"
                          value={staffFormData.name}
                          onChange={handleStaffChange}
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <select
                          name="role"
                          className="form-select"
                          value={staffFormData.role}
                          onChange={handleStaffChange}
                          required
                        >
                          <option value="">Select Role *</option>
                          <option value="Nurse">Nurse</option>
                          <option value="Attender">Attender</option>
                          <option value="Technician">Technician</option>
                          <option value="Receptionist">Receptionist</option>
                          <option value="Pharmacist">Pharmacist</option>
                          <option value="Lab Assistant">Lab Assistant</option>
                          <option value="Ward Boy">Ward Boy</option>
                          <option value="Security">Security</option>
                          <option value="Admin Staff">Admin Staff</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <select
                          name="department"
                          className="form-select"
                          value={staffFormData.department}
                          onChange={handleStaffChange}
                        >
                          <option value="">Select Department</option>
                          <option value="Cardiology">Cardiology</option>
                          <option value="Emergency">Emergency</option>
                          <option value="ICU">ICU</option>
                          <option value="General">General</option>
                          <option value="Ortho">Ortho</option>
                          <option value="Pediatrics">Pediatrics</option>
                          <option value="Gynecology">Gynecology</option>
                          <option value="Lab">Lab</option>
                          <option value="Pharmacy">Pharmacy</option>
                          <option value="Front Desk">Front Desk</option>
                          <option value="Administration">Administration</option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <input
                          type="email"
                          name="email"
                          className="form-control"
                          placeholder="Email *"
                          value={staffFormData.email}
                          onChange={handleStaffChange}
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <input
                          type="tel"
                          name="phone"
                          className="form-control"
                          placeholder="Phone Number"
                          value={staffFormData.phone}
                          onChange={handleStaffChange}
                          pattern="[0-9]{10}"
                        />
                      </div>
                      <div className="col-md-4">
                        <input
                          type="number"
                          name="salary"
                          className="form-control"
                          placeholder="Salary"
                          value={staffFormData.salary}
                          onChange={handleStaffChange}
                        />
                      </div>
                      <div className="col-md-4">
                        <input
                          type="date"
                          name="join_date"
                          className="form-control"
                          value={staffFormData.join_date}
                          onChange={handleStaffChange}
                        />
                      </div>
                      <div className="col-md-4">
                        <select
                          name="status"
                          className="form-select"
                          value={staffFormData.status}
                          onChange={handleStaffChange}
                        >
                          <option value="Active">Active</option>
                          <option value="On Leave">On Leave</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                      <div className="col-12">
                        <button type="submit" className="btn btn-success me-2">
                          {editingStaff ? "Update Staff" : "Save Staff"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setShowStaffForm(false);
                            setEditingStaff(null);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* Staff List Table */}
              <div className="card p-3">
                <h4 className="mb-3">
                  {selectedRole
                    ? `${selectedRole} List`
                    : selectedDepartment
                      ? `${selectedDepartment} Department Staff`
                      : staffFilter === "active"
                        ? "Active Staff List"
                        : staffFilter === "inactive"
                          ? "Inactive Staff List"
                          : staffFilter === "onLeave"
                            ? "Staff on Leave"
                            : "All Staff List"}
                  <span className="badge bg-secondary ms-2">
                    {selectedRole
                      ? staffByRole.length
                      : selectedDepartment
                        ? staffByDepartment.length
                        : filteredStaff.length}
                  </span>

                  {/* Filter reset button */}
                  {(staffFilter !== "all" ||
                    selectedRole ||
                    selectedDepartment) && (
                    <button
                      className="btn btn-sm btn-link ms-3"
                      onClick={() => {
                        setStaffFilter("all");
                        setSelectedRole(null);
                        setSelectedDepartment(null);
                        setStaffByRole([]);
                        setStaffByDepartment([]);
                        setFilteredStaff(staff);
                      }}
                    >
                      Clear Filter
                    </button>
                  )}
                </h4>

                <table className="table table-bordered table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Staff ID</th>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedRole
                      ? staffByRole
                      : selectedDepartment
                        ? staffByDepartment
                        : filteredStaff
                    ).map((member) => (
                      <tr key={member.id}>
                        <td>
                          <strong>{member.staff_id}</strong>
                        </td>
                        <td>{member.name}</td>
                        <td>
                          <span className="badge bg-info">{member.role}</span>
                        </td>
                        <td>
                          <span className="badge bg-secondary">
                            {member.department || "General"}
                          </span>
                        </td>
                        <td>{member.email}</td>
                        <td>{member.phone || "-"}</td>
                        <td>
                          <span
                            className={`badge bg-${
                              member.status === "Active"
                                ? "success"
                                : member.status === "On Leave"
                                  ? "warning"
                                  : "danger"
                            }`}
                          >
                            {member.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-warning me-2"
                            onClick={() => handleEditStaff(member)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteStaff(member.id)}
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PATIENT LIST SECTION */}
          {activeSection === "patientList" && (
            <>
              <div className="card mt-4 p-3 shadow-sm">
                <h4>
                  Patient Appointments (Total: {appointmentStats.totalPatients})
                </h4>

                <input
                  type="text"
                  className="form-control mt-3 mb-3"
                  placeholder="Search by name, phone or email..."
                  value={searchPatient}
                  onChange={(e) => setSearchPatient(e.target.value)}
                />

                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Patient Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Date</th>
                      <th>Department</th>
                      <th>Location</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointmentStats.allAppointments
                      .filter(
                        (app) =>
                          app.name
                            .toLowerCase()
                            .includes(searchPatient.toLowerCase()) ||
                          app.email
                            .toLowerCase()
                            .includes(searchPatient.toLowerCase()) ||
                          app.phone.includes(searchPatient),
                      )
                      .map((app) => (
                        <tr key={app.id}>
                          <td>{app.id}</td>
                          <td>{app.name}</td>
                          <td>{app.email}</td>
                          <td>{app.phone}</td>
                          <td>{new Date(app.date).toLocaleDateString()}</td>
                          <td>{app.department}</td>
                          <td>{app.location}</td>
                          <td>
                            <span
                              className={`badge bg-${
                                app.status === "Confirmed"
                                  ? "success"
                                  : app.status === "Pending"
                                    ? "warning"
                                    : app.status === "Cancelled"
                                      ? "danger"
                                      : "secondary"
                              }`}
                            >
                              {app.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* TODAY'S APPOINTMENTS SECTION */}
          {/* TODAY'S APPOINTMENTS SECTION */}
          {/* TODAY'S APPOINTMENTS SECTION */}
          {activeSection === "appointmentsList" && (
            <div className="card mt-4 p-3 shadow-sm">
              <div className="d-flex justify-content-between align-items-center">
                <h4>
                  Today's Appointments ({appointmentStats.todayAppointments})
                </h4>
                <div className="d-flex gap-2">
                  {/* Appointment Filters Dropdown */}
                  <select
                    className="form-select form-select-sm"
                    style={{ width: "150px" }}
                    onChange={(e) => {
                      const filter = e.target.value;
                      // Filter logic here
                    }}
                  >
                    <option value="all">All Departments</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Pediatrics">Pediatrics</option>
                  </select>

                  <select
                    className="form-select form-select-sm"
                    style={{ width: "130px" }}
                    onChange={(e) => {
                      const filter = e.target.value;
                      // Filter logic here
                    }}
                  >
                    <option value="all">All Status</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Pending">Pending</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>

                  <button
                    className="btn btn-sm btn-primary"
                    onClick={fetchAppointmentStats}
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>

              {/* Department-wise Summary Cards */}
              {appointmentStats.todayAppointmentsList?.length > 0 && (
                <>
                  <div className="row g-3 mb-4 mt-3">
                    <div className="col-12">
                      <h5 className="text-muted">📊 Department-wise Today</h5>
                    </div>
                    {Object.entries(
                      appointmentStats.todayAppointmentsList?.reduce(
                        (acc, app) => {
                          acc[app.department] = (acc[app.department] || 0) + 1;
                          return acc;
                        },
                        {},
                      ) || {},
                    ).map(([dept, count]) => (
                      <div className="col-md-2 col-sm-4" key={dept}>
                        <div
                          className="card text-white p-2 text-center"
                          style={{
                            background:
                              "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            // Filter by this department
                            console.log("Filter by:", dept);
                          }}
                        >
                          <h6 className="mb-1">{dept}</h6>
                          <h3 className="mb-0">{count}</h3>
                          <small>Booked</small>
                        </div>
                      </div>
                    ))}
                  </div>
                  <hr />
                </>
              )}

              {/* Appointments Table */}
              {appointmentStats.todayAppointmentsList?.length === 0 ? (
                <div className="alert alert-info mt-3">
                  No appointments for today da mapla! 🎉
                </div>
              ) : (
                <table className="table table-bordered mt-3">
                  <thead className="table-dark">
                    <tr>
                      <th>S.No</th>
                      <th>Time</th>
                      <th>Patient Name</th>
                      <th>Phone</th>
                      <th>Department</th>
                      <th>Location</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointmentStats.todayAppointmentsList?.map(
                      (app, index) => (
                        <tr key={app.id}>
                          <td>{index + 1}</td>
                          <td>
                            {new Date(app.created_at).toLocaleTimeString()}
                          </td>
                          <td>{app.name}</td>
                          <td>{app.phone}</td>
                          <td>
                            <span className="badge bg-primary">
                              {app.department}
                            </span>
                          </td>
                          <td>{app.location}</td>
                          <td>
                            <span
                              className={`badge bg-${
                                app.status === "Confirmed"
                                  ? "success"
                                  : app.status === "Pending"
                                    ? "warning"
                                    : app.status === "Cancelled"
                                      ? "danger"
                                      : "secondary"
                              }`}
                            >
                              {app.status}
                            </span>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
