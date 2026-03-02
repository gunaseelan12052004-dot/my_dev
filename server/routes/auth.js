// @ts-nocheck
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email & password venum da mapla' });
  }

  try {
    let user = null;
    let role = null;
    let table = null;

    // Step 1: Doctors table-la try pannu
    const [doctorRows] = await db.promise().query(
      'SELECT * FROM doctors WHERE email = ?',
      [email]
    );

    if (doctorRows.length > 0) {
      user = doctorRows[0];
      table = 'doctors';
      role = user.role || 'doctor';  // default doctor
    } else {
      // Step 2: Admin table-la paaru
      const [adminRows] = await db.promise().query(
        'SELECT * FROM admin WHERE email = ? OR username = ?',
        [email, email]  // email or username use panna chance
      );

      if (adminRows.length > 0) {
        user = adminRows[0];
        table = 'admin';
        role = user.role || 'admin';
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Accound not fount' });
    }

    // Password check (bcrypt)
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Password Wrong' });
    }

    // JWT token create
    const payload = {
      id: user.id,
      name: user.name || user.username,
      email: user.email,
      role: role,
      table: table,  // optional – frontend-la use panna
      doctor_id: user.doctor_id || null  // doctor mattum irukkum
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name || user.username,
        email: user.email,
        role: role,
        specialization: user.specialization || null
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Serverla prachanai da 😭' });
  }
});


module.exports = router;