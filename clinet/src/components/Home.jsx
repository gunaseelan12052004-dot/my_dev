import React, { useState, useEffect } from "react"; // Add useEffect here!
import "./Home.css";
import axios from "axios";

const Home = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    date: "",
    phone: "",
    department: "",
    doctor: "",
    location: "",
  });

  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Fetch doctors on component mount
  useEffect(() => {
    fetchDoctors();
  }, []); // This useEffect will work now

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

  // Filter doctors when department changes
  useEffect(() => {
    if (formData.department) {
      const filtered = doctors.filter(
        (doc) => doc.specialization === formData.department && doc.status === "Active"
      );
      setFilteredDoctors(filtered);
    } else {
      setFilteredDoctors([]);
    }
  }, [formData.department, doctors]); // This useEffect will work now

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await axios.post(
        "http://localhost:5000/api/appointments",
        formData,
      );

      if (response.data.success) {
        setMessage({
          text: "Appointment booked successfully da mapla! 🎉",
          type: "success",
        });

        setFormData({
          name: "",
          email: "",
          date: "",
          phone: "",
          department: "",
          doctor: "",
          location: "",
        });
      }
    } catch (error) {
      setMessage({
        text: error.response?.data?.message || "Booking failed da mapla! 😭",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hero-section">
      <div className="container">
        <div className="row align-items-center">
          {/* LEFT CONTENT */}
          <div className="col-lg-6 text-white">
            <h5 className="mb-3">DR.KAMARAJ HOSPITALS Pvt. Ltd</h5>

            <h1 className="fw-bold display-5">
              Trusted Male Fertility Hospital in Chennai
            </h1>

            <p className="mt-3">
              35 Years of Legacy in Restoring Hope for Men's Health & Wellness
            </p>

            <button className="btn btn-danger mt-3">
              Doctors available on video calls
            </button>

            <br />

            <a href="tel:+919444944444" className="call-btn mt-4">
              📞 +91 94449 44444
            </a>
          </div>

          {/* RIGHT FORM */}
          <div className="col-lg-6 mt-5 mt-lg-0">
            <div className="appointment-card shadow">
              <h3 className="text-center mb-4 fw-bold">BOOK AN APPOINTMENT</h3>

              {message.text && (
                <div
                  className={`alert alert-${message.type === "success" ? "success" : "danger"} mb-3`}
                >
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      placeholder="Enter Your Name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      placeholder="Enter Your Email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <input
                      type="date"
                      name="date"
                      className="form-control"
                      value={formData.date}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <input
                      type="tel"
                      name="phone"
                      className="form-control"
                      placeholder="Enter Your Phone"
                      value={formData.phone}
                      onChange={handleChange}
                      pattern="[0-9]{10}"
                      title="10 digit phone number"
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <select
                      name="department"
                      className="form-select"
                      value={formData.department}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Department</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Dermatology">Dermatology</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Gynecology">Gynecology</option>
                      <option value="Orthopedics">Orthopedics</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="General Medicine">General Medicine</option>
                    </select>
                  </div>

                  {/* Doctor Dropdown */}
                  <div className="col-md-6">
                    <select
                      name="doctor"
                      className="form-select"
                      value={formData.doctor}
                      onChange={handleChange}
                      required
                      disabled={!formData.department}
                    >
                      <option value="">
                        {formData.department 
                          ? filteredDoctors.length > 0 
                            ? "Select Doctor" 
                            : "No doctors available" 
                          : "Select department first"}
                      </option>
                      {filteredDoctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.doctor_id}>
                          Dr. {doctor.name}
                        </option>
                      ))}
                    </select>
                    {formData.department && filteredDoctors.length === 0 && (
                      <small className="text-warning">
                        ⚠️ No active doctors in {formData.department}
                      </small>
                    )}
                  </div>

                  <div className="col-md-6">
                    <select
                      name="location"
                      className="form-select"
                      value={formData.location}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Location</option>
                      <option value="Chennai">Chennai</option>
                      <option value="Coimbatore">Coimbatore</option>
                      <option value="Madurai">Madurai</option>
                    </select>
                  </div>

                  <div className="col-12 text-center mt-3">
                    <button
                      type="submit"
                      className="btn btn-primary px-4 rounded-pill"
                      disabled={loading}
                    >
                      {loading ? "Booking..." : "Submit"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;