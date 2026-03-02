const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Generate staff ID
const generateStaffId = () => {
  return new Promise((resolve, reject) => {
    db.query("SELECT staff_id FROM staff ORDER BY id DESC LIMIT 1", (error, results) => {
      if (error) {
        reject(error);
        return;
      }
      
      let newId = "STF001";
      if (results.length > 0) {
        const lastId = results[0].staff_id;
        const num = parseInt(lastId.replace("STF", "")) + 1;
        newId = `STF${String(num).padStart(3, "0")}`;
      }
      resolve(newId);
    });
  });
};

// Get all staff
router.get('/', (req, res) => {
  db.query("SELECT * FROM staff ORDER BY created_at DESC", (error, results) => {
    if (error) {
      console.error("Error fetching staff:", error);
      return res.status(500).json({ success: false, message: "Error fetching staff" });
    }
    res.json({ success: true, staff: results });
  });
});

// Get staff stats with role-wise count
router.get('/stats', (req, res) => {
  const queries = {
    total: "SELECT COUNT(*) as count FROM staff",
    active: "SELECT COUNT(*) as count FROM staff WHERE status = 'Active'",
    inactive: "SELECT COUNT(*) as count FROM staff WHERE status = 'Inactive'",
    onLeave: "SELECT COUNT(*) as count FROM staff WHERE status = 'On Leave'",
    byRole: "SELECT role, COUNT(*) as count FROM staff GROUP BY role ORDER BY count DESC",
    byDepartment: "SELECT department, COUNT(*) as count FROM staff WHERE department IS NOT NULL GROUP BY department ORDER BY count DESC"
  };

  db.query(queries.total, (err1, totalRes) => {
    db.query(queries.active, (err2, activeRes) => {
      db.query(queries.inactive, (err3, inactiveRes) => {
        db.query(queries.onLeave, (err4, leaveRes) => {
          db.query(queries.byRole, (err5, roleRes) => {
            db.query(queries.byDepartment, (err6, deptRes) => {
              res.json({
                success: true,
                stats: {
                  total: totalRes[0]?.count || 0,
                  active: activeRes[0]?.count || 0,
                  inactive: inactiveRes[0]?.count || 0,
                  onLeave: leaveRes[0]?.count || 0,
                  byRole: roleRes || [],
                  byDepartment: deptRes || []
                }
              });
            });
          });
        });
      });
    });
  });
});

// Get staff by role
router.get('/role/:role', (req, res) => {
  const { role } = req.params;
  
  db.query(
    "SELECT * FROM staff WHERE role = ? ORDER BY name", 
    [role], 
    (error, results) => {
      if (error) {
        console.error("Error fetching staff by role:", error);
        return res.status(500).json({ success: false, message: "Error fetching staff" });
      }
      res.json({ success: true, staff: results, role: role });
    }
  );
});

// Add new staff
router.post('/', async (req, res) => {
  try {
    const { name, role, department, email, phone, salary, join_date, status } = req.body;
    
    if (!name || !role || !email) {
      return res.status(400).json({ 
        success: false, 
        message: "Name, role and email required da mapla!" 
      });
    }

    const staff_id = await generateStaffId();

    const query = `
      INSERT INTO staff (staff_id, name, role, department, email, phone, salary, join_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [staff_id, name, role, department, email, phone, salary, join_date, status || 'Active'], 
    (error, result) => {
      if (error) {
        console.error("Error adding staff:", error);
        if (error.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ success: false, message: "Email already exists!" });
        }
        return res.status(500).json({ success: false, message: "Database error" });
      }

      res.status(201).json({
        success: true,
        message: "Staff added successfully da mapla! 🎉",
        staff_id: staff_id
      });
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update staff
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, role, department, email, phone, salary, join_date, status } = req.body;

  const query = `
    UPDATE staff 
    SET name = ?, role = ?, department = ?, email = ?, 
        phone = ?, salary = ?, join_date = ?, status = ?
    WHERE id = ?
  `;

  db.query(query, [name, role, department, email, phone, salary, join_date, status, id], 
  (error, result) => {
    if (error) {
      console.error("Error updating staff:", error);
      return res.status(500).json({ success: false, message: "Update failed" });
    }

    res.json({ 
      success: true, 
      message: "Staff updated successfully da mapla! ✨" 
    });
  });
});

// Delete staff
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM staff WHERE id = ?", [id], (error, result) => {
    if (error) {
      console.error("Error deleting staff:", error);
      return res.status(500).json({ success: false, message: "Delete failed" });
    }

    res.json({ 
      success: true, 
      message: "Staff deleted successfully da mapla! 🗑️" 
    });
  });
});

module.exports = router;