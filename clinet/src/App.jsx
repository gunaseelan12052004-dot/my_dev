import { Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import DoctorDashboard from "./components/DoctorDashboard";
import DoctorLogin from "./components/DoctorLogin";
import AdminDashboard from "./components/AdminDashboard";
function App() {
  return (
    <Routes>
      <Route path="/" element={<DoctorLogin />} />
      <Route path="/home" element={<Home />} />
      <Route path="/DoctorLogin" element={<DoctorLogin />} />
      <Route path="/dashboard" element={<DoctorDashboard />} />
      <Route path="/AdminDashboard" element={<AdminDashboard />} />
    </Routes>
   
  );
}

export default App;