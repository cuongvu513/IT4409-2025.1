// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Import các trang
import OutsidePage from './pages/Outside/OutsidePage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';

// Import 2 trang Dashboard mới
import StudentDashboardPage from './pages/Student/StudentDashboardPage';
import ExamPage from './pages/Student/ExamPage';
import ResultPage from './pages/Student/ResultPage';
import TeacherDashboardPage from './pages/Teacher/TeacherDashboardPage';

//trang danhsachlop
import TeacherClassesPage from './pages/Teacher/TeacherClassesPage';
//chitiettunglop
import ClassDetailPage from './pages/Teacher/ClassDetailPage';
// ngân hàng câu hỏi
import TeacherQuestionsPage from './pages/Teacher/TeacherQuestionsPage';
//template de thi
import TeacherTemplatesPage from './pages/Teacher/TeacherTemplatesPage';
// de thi
import TeacherExamInstancesPage from './pages/Teacher/TeacherExamInstancesPage';


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
          {/* Duong dan cho lam bai va ket qua nam ben trong StudentDashboardPage */}
          <Route path="/student/exam" element={<ExamPage />} />
          <Route path="/student/result/:examId" element={<ResultPage />} />
          {/* Đường dẫn cho Giáo viên */}
          <Route path="/teacher/dashboard" element={<TeacherDashboardPage />} />

          <Route path="/teacher/classes" element={<TeacherClassesPage />} />

          <Route path="/teacher/classes/:id" element={<ClassDetailPage />} />

          <Route path="/teacher/questions" element={<TeacherQuestionsPage />} />

          <Route path="/teacher/exam-templates" element={<TeacherTemplatesPage />} />

          <Route path="/teacher/exam-templates/:templateId" element={<TeacherExamInstancesPage />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;