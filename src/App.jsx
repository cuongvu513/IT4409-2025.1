// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Import các trang
import OutsidePage from './pages/Outside/OutsidePage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';

// Import 2 trang Dashboard mới
import StudentDashboardPage from './pages/Student/StudentDashboardPage';
import TeacherDashboardPage from './pages/Teacher/TeacherDashboardPage';

//trang danhsachlop
import TeacherClassesPage from './pages/Teacher/TeacherClassesPage';
//chitiettunglop
import ClassDetailPage from './pages/Teacher/ClassDetailPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<OutsidePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Đường dẫn cho Học sinh */}
          <Route path="/student/dashboard" element={<StudentDashboardPage />} />

          {/* Đường dẫn cho Giáo viên */}
          <Route path="/teacher/dashboard" element={<TeacherDashboardPage />} />

          <Route path="/teacher/classes" element={<TeacherClassesPage />} />

          <Route path="/teacher/classes/:id" element={<ClassDetailPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;