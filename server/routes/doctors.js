// @ts-nocheck
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

// GET /api/doctors/max-id - Get max doctor_id for generating new ID
router.get('/max-id', async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      'SELECT doctor_id FROM doctors ORDER BY id DESC LIMIT 1'
    );
    
    const maxId = rows.length > 0 ? rows[0].doctor_id : 'DOC000';
    res.json({ maxId });
  } catch (err) {
    console.error('Error getting max doctor ID:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/doctors - Add new doctor
router.post('/', async (req, res) => {
  const { name, specialization, email, phone, password, status, doctor_id } = req.body;

  // Validate required fields
  if (!name || !specialization || !email || !password || !doctor_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'Required fields missing da mapla!' 
    });
  }

  try {
    // Check if email already exists
    const [existingEmail] = await db.promise().query(
      'SELECT email FROM doctors WHERE email = ?',
      [email]
    );

    if (existingEmail.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already exists da mapla!' 
      });
    }

    // Check if doctor_id already exists
    const [existingId] = await db.promise().query(
      'SELECT doctor_id FROM doctors WHERE doctor_id = ?',
      [doctor_id]
    );

    if (existingId.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Doctor ID already exists da mapla!' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new doctor
    const [result] = await db.promise().query(
      `INSERT INTO doctors (doctor_id, name, specialization, email, password, phone, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [doctor_id, name, specialization, email, hashedPassword, phone, status || 'Active']
    );

    res.status(201).json({
      success: true,
      message: 'Doctor added successfully da mapla! 🎉',
      doctor: {
        id: result.insertId,
        doctor_id,
        name,
        specialization,
        email,
        phone,
        status: status || 'Active'
      }
    });

  } catch (err) {
    console.error('Error adding doctor:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error da mapla! 😭' 
    });
  }
});

// GET /api/doctors - Get all doctors
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      'SELECT id, doctor_id, name, specialization, email, phone, status, created_at FROM doctors ORDER BY id DESC'
    );
    
    res.json({
      success: true,
      doctors: rows
    });
  } catch (err) {
    console.error('Error fetching doctors:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error da mapla!' 
    });
  }
});

// GET /api/doctors/:id - Get single doctor by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      'SELECT id, doctor_id, name, specialization, email, phone, status, created_at FROM doctors WHERE id = ? OR doctor_id = ?',
      [req.params.id, req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Doctor not found da mapla!' 
      });
    }
    
    res.json({
      success: true,
      doctor: rows[0]
    });
  } catch (err) {
    console.error('Error fetching doctor:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error da mapla!' 
    });
  }
});

// PUT /api/doctors/:id - Update doctor
router.put('/:id', async (req, res) => {
  const { name, specialization, email, phone, status } = req.body;
  
  try {
    // Check if doctor exists
    const [existing] = await db.promise().query(
      'SELECT id FROM doctors WHERE id = ? OR doctor_id = ?',
      [req.params.id, req.params.id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Doctor not found da mapla!' 
      });
    }

    // Update doctor
    await db.promise().query(
      `UPDATE doctors 
       SET name = ?, specialization = ?, email = ?, phone = ?, status = ?
       WHERE id = ?`,
      [name, specialization, email, phone, status, existing[0].id]
    );

    res.json({
      success: true,
      message: 'Doctor updated successfully da mapla!'
    });

  } catch (err) {
    console.error('Error updating doctor:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error da mapla!' 
    });
  }
});

// DELETE /api/doctors/:id - Delete doctor
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.promise().query(
      'DELETE FROM doctors WHERE id = ? OR doctor_id = ?',
      [req.params.id, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Doctor not found da mapla!' 
      });
    }
    
    res.json({
      success: true,
      message: 'Doctor deleted successfully da mapla!'
    });

  } catch (err) {
    console.error('Error deleting doctor:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error da mapla!' 
    });
  }
});

module.exports = router;