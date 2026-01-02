/* eslint-disable no-undef */
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_CONN)
.then(()=> {
    console.log("Database connected")
})
.catch((err) => {
    console.error(err);
});
mongoose.Promise = global.Promise;

// Routes
const AdminRoutes = require('./routes/AdminRoutes');
const TeacherRoutes = require('./routes/TeacherRoutes');
const StudentRoutes = require('./routes/StudentRoutes');
const ParentRoutes = require('./routes/ParentRoutes');
const LessonRoutes = require('./routes/LessonRoutes');
const ProgressRoutes = require('./routes/ProgressRoutes');
const AssignmentRoutes = require('./routes/AssignmentRoutes');
const SubmissionRoutes = require('./routes/SubmissionRoutes');
const MessageRoutes = require('./routes/MessageRoutes');
const UserRoutes = require('./routes/UserRoutes');

const app = express();

// Request timeout middleware - prevent hanging requests
app.use((req, res, next) => {
  // Set timeout for all requests (20 seconds)
  req.setTimeout(20000);
  res.setTimeout(20000);
  
  // Timeout handler
  const timeoutHandler = () => {
    if (!res.headersSent) {
      console.error(`⏱️ Request timeout: ${req.method} ${req.url}`);
      res.status(504).json({
        success: false,
        message: 'Request timeout - server took too long to respond',
        error: 'Gateway Timeout'
      });
    }
  };
  
  req.on('timeout', timeoutHandler);
  res.on('timeout', timeoutHandler);
  
  next();
});

// Middleware
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
    'https://tinylearn.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// Mount routes
app.use('/api/admins', AdminRoutes);

app.use('/api/teachers', TeacherRoutes);
app.use('/api/students', StudentRoutes);
app.use('/api/parents', ParentRoutes);
app.use('/api/lessons', LessonRoutes);
app.use('/api/progress', ProgressRoutes);
app.use('/api/assignments', AssignmentRoutes);
app.use('/api/submissions', SubmissionRoutes);
app.use('/api/messages', MessageRoutes);
app.use('/api/users', UserRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'TinyLearn API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV
  });
});


module.exports = app;
