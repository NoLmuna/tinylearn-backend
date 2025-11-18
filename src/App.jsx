import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { SocketProvider } from './contexts/SocketContext.jsx';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Lessons from './pages/Lessons';
import Login from './pages/Auth/Login';
import AdminLogin from './pages/Auth/AdminLogin';
import StudentDashboard from './pages/dashboards/Student/StudentDashboard';
import StudentLessons from './pages/dashboards/Student/StudentLessons';
import StudentAssignments from './pages/dashboards/Student/StudentAssignments';
import StudentProgress from './pages/dashboards/Student/StudentProgress';
import StudentProfile from './pages/dashboards/Student/StudentProfile';
import StudentViewLesson from './pages/dashboards/Student/ViewLesson.jsx';
import TeacherDashboard from './pages/dashboards/Teacher/TeacherDashboard.jsx';
import CreateLesson from './pages/dashboards/Teacher/CreateLesson.jsx';
import CreateAssignment from './pages/dashboards/Teacher/CreateAssignment.jsx';
import TeacherLessons from './pages/dashboards/Teacher/TeacherLessons.jsx';
import TeacherAssignments from './pages/dashboards/Teacher/TeacherAssignments.jsx';
import TeacherStudents from './pages/dashboards/Teacher/TeacherStudents.jsx';
import TeacherMessages from './pages/dashboards/Teacher/TeacherMessagesRedesigned.jsx';
import GradeAssignment from './pages/dashboards/Teacher/GradeAssignment.jsx';
import ViewLesson from './pages/dashboards/Teacher/ViewLesson.jsx';
import ViewAssignment from './pages/dashboards/Teacher/ViewAssignment.jsx';
import ParentDashboard from './pages/dashboards/Parent/ParentDashboard';
import ParentProgress from './pages/dashboards/Parent/ParentProgress';
import ParentMessages from './pages/dashboards/Parent/ParentMessagesNew';
import AdminDashboard from './pages/dashboards/Admin/AdminDashboard';
import AdminUsers from './pages/dashboards/Admin/AdminUsers';
import AdminUserDetails from './pages/dashboards/Admin/AdminUserDetails.jsx';
import AdminSystem from './pages/dashboards/Admin/AdminSystem';
import AdminReports from './pages/dashboards/Admin/AdminReports';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Admin Routes - Separate login and protected section */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route 
            path="/admin/*" 
            element={<AdminProtectedRoute />} 
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="users/:role/:userId" element={<AdminUserDetails />} />
            <Route path="system" element={<AdminSystem />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="" element={<Navigate to="dashboard" replace />} />
          </Route>
          
          {/* Regular User Role-specific Dashboard Routes */}
          <Route 
            path="/teacher/*" 
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <Routes>
                  <Route path="" element={<TeacherDashboard />} />
                  <Route path="lessons" element={<TeacherLessons />} />
                  <Route path="lessons/create" element={<CreateLesson />} />
                  <Route path="lessons/:lessonId" element={<ViewLesson />} />
                  <Route path="assignments" element={<TeacherAssignments />} />
                  <Route path="assignments/create" element={<CreateAssignment />} />
                  <Route path="assignments/:assignmentId/grade" element={<GradeAssignment />} />
                  <Route path="assignments/:assignmentId" element={<ViewAssignment />} />
                  <Route path="students" element={<TeacherStudents />} />
                  <Route path="messages" element={<TeacherMessages />} />
                </Routes>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/parent/*" 
            element={
              <ProtectedRoute allowedRoles={['parent']}>
                <Routes>
                  <Route path="" element={<ParentDashboard />} />
                  <Route path="progress" element={<ParentProgress />} />
                  <Route path="messages" element={<ParentMessages />} />
                </Routes>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/*" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <Routes>
                  <Route path="" element={<StudentDashboard />} />
                  <Route path="lessons" element={<StudentLessons />} />
                  <Route path="lessons/:lessonId" element={<StudentViewLesson />} />
                  <Route path="assignments" element={<StudentAssignments />} />
                  <Route path="progress" element={<StudentProgress />} />
                  <Route path="profile" element={<StudentProfile />} />
                </Routes>
              </ProtectedRoute>
            } 
          />

          {/* Public routes with shared layout */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="lessons" element={<Lessons />} />
            <Route 
              path="dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
          </Route>

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
