// @ts-nocheck

const mysql = require('mysql2');
const dotenv = require('dotenv');  // Only ONE time!

dotenv.config();

// Create connection without database
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 3306
});

// Create database and tables
connection.connect((err) => {
  if (err) {
    console.error('❌ MySQL Connection Error:', err);
    return;
  }
  
  console.log('✅ Connected to MySQL');
  
  // Create database
  connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`, (err) => {
    if (err) {
      console.error('❌ Error creating database:', err);
      return;
    }
    
    console.log(`✅ Database ${process.env.DB_NAME} created or exists`);
    
    // Use the database
    connection.changeUser({database: process.env.DB_NAME}, (err) => {
      if (err) {
        console.error('❌ Error switching database:', err);
        return;
      }
      
      // Create users table
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role ENUM('admin', 'doctor', 'patient', 'staff') DEFAULT 'patient',
          phone VARCHAR(20),
          specialization VARCHAR(100),
          department VARCHAR(100),
          isActive BOOLEAN DEFAULT true,
          lastLogin TIMESTAMP NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_email (email),
          INDEX idx_role (role)
        )
      `;
      
      connection.query(createTableQuery, (err) => {
        if (err) {
          console.error('❌ Error creating table:', err);
          return;
        }
        
        console.log('✅ Users table created or exists');
        
        // Insert sample users
        const bcrypt = require('bcryptjs');
        const saltRounds = 10;
        
        const sampleUsers = [
          {
            name: 'Admin User',
            email: 'admin@hospital.com',
            password: '1234',
            role: 'admin',
            phone: '1234567890',
            department: 'Administration'
          },
          {
            name: 'Dr. John Smith',
            email: 'doctor@hospital.com',
            password: '1234',
            role: 'doctor',
            phone: '9876543210',
            specialization: 'Cardiologist',
            department: 'Cardiology'
          },
          {
            name: 'Dr. Sarah Johnson',
            email: 'sarah.doctor@hospital.com',
            password: '1234',
            role: 'doctor',
            phone: '5555555555',
            specialization: 'Neurologist',
            department: 'Neurology'
          }
        ];
        
        // Hash passwords and insert users
        const insertUsers = async () => {
          for (const user of sampleUsers) {
            const hashedPassword = await bcrypt.hash(user.password, saltRounds);
            
            const checkQuery = 'SELECT * FROM users WHERE email = ?';
            connection.query(checkQuery, [user.email], (err, results) => {
              if (err) {
                console.error('❌ Error checking user:', err);
                return;
              }
              
              if (results.length === 0) {
                const insertQuery = `
                  INSERT INTO users (name, email, password, role, phone, specialization, department)
                  VALUES (?, ?, ?, ?, ?, ?, ?)
                `;
                
                connection.query(insertQuery, 
                  [user.name, user.email, hashedPassword, user.role, user.phone, user.specialization || null, user.department || null],
                  (err) => {
                    if (err) {
                      console.error(`❌ Error inserting user ${user.email}:`, err);
                    } else {
                      console.log(`✅ Created user: ${user.email}`);
                    }
                  }
                );
              } else {
                console.log(`⏭️  User ${user.email} already exists`);
              }
            });
          }
        };
        
        insertUsers();
        
        setTimeout(() => {
          console.log('🎉 Database setup completed!');
          connection.end();
        }, 2000);
      });
    });
  });
});