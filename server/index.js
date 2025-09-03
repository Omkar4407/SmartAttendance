const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${req.body.name.toLowerCase().replace(/\s+/g, '_')}.jpg`);
  }
});
const upload = multer({ storage });

// Initialize SQLite database
const db = new sqlite3.Database('attendance.db');

// Create tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    email TEXT,
    role TEXT DEFAULT 'student',
    image_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'present',
    confidence REAL,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Import existing CSV data
  const csvData = fs.readFileSync('attendance.csv', 'utf8');
  const lines = csvData.trim().split('\n');
  
  lines.forEach(line => {
    const [name, timestamp] = line.split(',');
    if (name && timestamp) {
      // Insert user if not exists
      db.run(`INSERT OR IGNORE INTO users (name) VALUES (?)`, [name.trim()]);
      
      // Insert attendance record
      db.run(`INSERT INTO attendance (user_id, timestamp, status) 
              SELECT id, ?, 'present' FROM users WHERE name = ?`, 
              [timestamp.trim(), name.trim()]);
    }
  });
});

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ port: 8080 });

const broadcast = (data) => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

// Face recognition simulation
class FaceRecognitionEngine {
  constructor() {
    this.knownUsers = [];
    this.recentlyMarked = new Set();
    this.isProcessing = false;
    this.loadKnownUsers();
  }

  loadKnownUsers() {
    db.all("SELECT * FROM users", (err, rows) => {
      if (!err) {
        this.knownUsers = rows;
      }
    });
  }

  async processFrame() {
    if (this.isProcessing) return null;
    
    this.isProcessing = true;
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Simulate face detection (70% chance of detecting someone)
    if (Math.random() < 0.7 && this.knownUsers.length > 0) {
      const randomUser = this.knownUsers[Math.floor(Math.random() * this.knownUsers.length)];
      const confidence = 0.85 + Math.random() * 0.1; // 85-95% confidence
      
      this.isProcessing = false;
      return {
        user: randomUser,
        confidence: confidence * 100,
        timestamp: new Date().toISOString()
      };
    }
    
    this.isProcessing = false;
    return null;
  }

  markAttendance(userId, confidence) {
    return new Promise((resolve, reject) => {
      // Check if already marked recently (within 30 seconds)
      if (this.recentlyMarked.has(userId)) {
        resolve({ success: false, message: 'Already marked recently' });
        return;
      }

      db.run(
        `INSERT INTO attendance (user_id, confidence, status) VALUES (?, ?, 'present')`,
        [userId, confidence],
        function(err) {
          if (err) {
            reject(err);
          } else {
            // Add to recently marked and remove after 30 seconds
            this.recentlyMarked.add(userId);
            setTimeout(() => {
              this.recentlyMarked.delete(userId);
            }, 30000);

            resolve({ 
              success: true, 
              attendanceId: this.lastID,
              message: 'Attendance marked successfully'
            });
          }
        }
      );
    });
  }
}

const faceEngine = new FaceRecognitionEngine();

// API Routes

// Get dashboard stats
app.get('/api/stats', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  db.all(`
    SELECT 
      COUNT(DISTINCT u.id) as total_users,
      COUNT(DISTINCT CASE WHEN DATE(a.timestamp) = ? THEN a.user_id END) as present_today,
      COUNT(DISTINCT CASE WHEN DATE(a.timestamp) = ? AND a.status = 'late' THEN a.user_id END) as late_today
    FROM users u
    LEFT JOIN attendance a ON u.id = a.user_id
  `, [today, today], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    const stats = rows[0];
    const absent_today = stats.total_users - stats.present_today;
    const attendance_rate = stats.total_users > 0 ? (stats.present_today / stats.total_users) * 100 : 0;
    
    res.json({
      totalUsers: stats.total_users,
      presentToday: stats.present_today,
      lateToday: stats.late_today,
      absentToday: absent_today,
      attendanceRate: attendance_rate
    });
  });
});

// Get all users with attendance summary
app.get('/api/users', (req, res) => {
  db.all(`
    SELECT 
      u.*,
      COUNT(a.id) as total_attendance,
      COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
      COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
      COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days
    FROM users u
    LEFT JOIN attendance a ON u.id = a.user_id
    GROUP BY u.id
    ORDER BY u.name
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get attendance records
app.get('/api/attendance', (req, res) => {
  const { date, user_id } = req.query;
  let query = `
    SELECT a.*, u.name, u.role 
    FROM attendance a 
    JOIN users u ON a.user_id = u.id 
    WHERE 1=1
  `;
  const params = [];

  if (date) {
    query += ` AND DATE(a.timestamp) = ?`;
    params.push(date);
  }

  if (user_id) {
    query += ` AND a.user_id = ?`;
    params.push(user_id);
  }

  query += ` ORDER BY a.timestamp DESC LIMIT 100`;

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Register new user
app.post('/api/users', upload.single('image'), (req, res) => {
  const { name, email, role } = req.body;
  const imagePath = req.file ? req.file.path : null;

  db.run(
    `INSERT INTO users (name, email, role, image_path) VALUES (?, ?, ?, ?)`,
    [name, email || null, role || 'student', imagePath],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Reload known users for face recognition
      faceEngine.loadKnownUsers();
      
      res.json({ 
        id: this.lastID, 
        name, 
        email, 
        role: role || 'student',
        message: 'User registered successfully' 
      });
    }
  );
});

// Start face recognition
app.post('/api/recognition/start', (req, res) => {
  res.json({ success: true, message: 'Face recognition started' });
  
  // Start recognition loop
  const recognitionLoop = async () => {
    try {
      const result = await faceEngine.processFrame();
      
      if (result) {
        broadcast({
          type: 'face_detected',
          data: {
            user: result.user,
            confidence: result.confidence,
            timestamp: result.timestamp
          }
        });

        // Try to mark attendance
        try {
          const attendanceResult = await faceEngine.markAttendance(result.user.id, result.confidence);
          
          if (attendanceResult.success) {
            broadcast({
              type: 'attendance_marked',
              data: {
                user: result.user,
                confidence: result.confidence,
                timestamp: result.timestamp,
                message: `Attendance marked for ${result.user.name}`
              }
            });
          }
        } catch (error) {
          console.error('Error marking attendance:', error);
        }
      }
      
      // Continue recognition loop
      setTimeout(recognitionLoop, 2000);
    } catch (error) {
      console.error('Recognition error:', error);
    }
  };

  recognitionLoop();
});

// Manual attendance marking
app.post('/api/attendance/mark', (req, res) => {
  const { user_id, status } = req.body;
  
  db.run(
    `INSERT INTO attendance (user_id, status) VALUES (?, ?)`,
    [user_id, status || 'present'],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Get user info and broadcast update
      db.get(`SELECT * FROM users WHERE id = ?`, [user_id], (err, user) => {
        if (!err && user) {
          broadcast({
            type: 'attendance_marked',
            data: {
              user,
              timestamp: new Date().toISOString(),
              message: `Attendance marked for ${user.name}`
            }
          });
        }
      });
      
      res.json({ 
        id: this.lastID, 
        message: 'Attendance marked successfully' 
      });
    }
  );
});

// Get weekly attendance data for charts
app.get('/api/attendance/weekly', (req, res) => {
  const query = `
    SELECT 
      strftime('%w', timestamp) as day_of_week,
      COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
      COUNT(CASE WHEN status = 'late' THEN 1 END) as late,
      COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent
    FROM attendance 
    WHERE timestamp >= date('now', '-7 days')
    GROUP BY strftime('%w', timestamp)
    ORDER BY day_of_week
  `;

  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = dayNames.map((day, index) => {
      const dayData = rows.find(row => parseInt(row.day_of_week) === index);
      return {
        day,
        present: dayData ? dayData.present : 0,
        late: dayData ? dayData.late : 0,
        absent: dayData ? dayData.absent : 0
      };
    });

    res.json(weeklyData);
  });
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received:', data);
    } catch (error) {
      console.error('Invalid WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:8080`);
});