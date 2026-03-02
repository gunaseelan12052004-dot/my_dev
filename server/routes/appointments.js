const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ✅ FIRST - Specific routes (with parameters)
// GET today's appointments with details
router.get('/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  const query = "SELECT * FROM appointments WHERE date = ? ORDER BY created_at DESC";
  
  db.query(query, [today], (error, results) => {
    if (error) {
      console.error("❌ Error fetching today's appointments:", error);
      return res.status(500).json({ success: false, appointments: [] });
    }
    
    res.json({ 
      success: true, 
      appointments: results,
      count: results.length
    });
  });
});

// GET today's appointments count
router.get('/today/count', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  const query = "SELECT COUNT(*) as count FROM appointments WHERE date = ?";
  
  db.query(query, [today], (error, result) => {
    if (error) {
      console.error("❌ Error fetching today's count:", error);
      return res.status(500).json({ success: false, count: 0 });
    }
    
    res.json({ 
      success: true, 
      count: result[0].count 
    });
  });
});

// GET total appointments count
router.get('/total/count', (req, res) => {
  const query = "SELECT COUNT(*) as count FROM appointments";
  
  db.query(query, (error, result) => {
    if (error) {
      console.error("Error fetching total count:", error);
      return res.status(500).json({ success: false, count: 0 });
    }
    
    res.json({ 
      success: true, 
      count: result[0].count 
    });
  });
});

// GET all appointments
router.get('/all', (req, res) => {
  const query = "SELECT * FROM appointments ORDER BY created_at DESC";
  
  db.query(query, (error, results) => {
    if (error) {
      console.error("Error fetching appointments:", error);
      return res.status(500).json({ success: false, appointments: [] });
    }
    
    res.json({ 
      success: true, 
      appointments: results 
    });
  });
});

// ✅ THEN - Default routes
// Get all appointments (default)
router.get('/', (req, res) => {
  db.query("SELECT * FROM appointments ORDER BY created_at DESC", (error, results) => {
    if (error) {
      console.error("❌ Error fetching appointments:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Error fetching appointments" 
      });
    }
    
    res.json({
      success: true,
      appointments: results
    });
  });
});

// ✅ LAST - Dynamic routes with parameters (like /:id)
// Update appointment status
router.patch('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  db.query(
    'UPDATE appointments SET status = ? WHERE id = ?',
    [status, id],
    (error, result) => {
      if (error) {
        console.error("❌ Error updating status:", error);
        return res.status(500).json({ 
          success: false, 
          message: "Error updating status" 
        });
      }
      
      res.json({ 
        success: true, 
        message: "Status updated da mapla!" 
      });
    }
  );
});

// ✅ SINGLE POST ROUTE - Book appointment (WITH doctor field)
router.post('/', (req, res) => {
  console.log("📝 Request received:", req.body);
  
  const { name, email, date, phone, department, doctor, location } = req.body;
  
  // Validation - include doctor field
  if (!name || !email || !date || !phone || !department || !doctor || !location) {
    console.log("❌ Missing fields:", { name, email, date, phone, department, doctor, location });
    return res.status(400).json({ 
      success: false, 
      message: "All fields required da mapla! Including doctor" 
    });
  }

  const query = `
    INSERT INTO appointments (name, email, date, phone, department, doctor, location, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', NOW())
  `;
  
  const values = [name, email, date, phone, department, doctor, location];
  
  console.log("📝 Query values:", values);

  db.query(query, values, (error, result) => {
    if (error) {
      console.error("❌ Database error:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Database error da mapla! 😭" 
      });
    }
    
    console.log("✅ Insert successful, ID:", result.insertId);
    
    res.status(201).json({
      success: true,
      message: "Appointment booked successfully da mapla! 🎉",
      appointmentId: result.insertId
    });
  });
});

module.exports = router;