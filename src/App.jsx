// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Layouts
import StudentLayout from './layouts/StudentLayout';
import TeacherLayout from './layouts/TeacherLayout';

// Import các trang
import OutsidePage from './pages/Outside/OutsidePage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';

// Import 2 trang Dashboard mới
import StudentDashboardPage from './pages/Student/StudentDashboardPage';
import TeacherDashboardPage from './pages/Teacher/TeacherDashboardPage';

// trang cho teacher
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

// trang cho student
import StudentClassesPage from './pages/Student/StudentClassesPage';
import StudentClassExamsPage from './pages/Student/StudentClassExamsPage';
import StudentTakeExamPage from './pages/Student/StudentTakeExamPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<OutsidePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />


          {/* Đường dẫn cho Học sinh */}
          <Route path="/student" element={<StudentLayout />}>
            <Route path="dashboard" element={<StudentDashboardPage />} />
            <Route path="classes" element={<StudentClassesPage />} />
            <Route path="classes/:classId/exams" element={<StudentClassExamsPage />} />
            <Route path="exam/take/:examId" element={<StudentTakeExamPage />} />
          </Route>



          {/* Đường dẫn cho Giáo viên */}
          <Route path="/teacher" element={<TeacherLayout />}>
            <Route path="dashboard" element={<TeacherDashboardPage />} />
            <Route path="classes" element={<TeacherClassesPage />} />
            <Route path="classes/:id" element={<ClassDetailPage />} />
            <Route path="questions" element={<TeacherQuestionsPage />} />
            <Route path="exam-templates" element={<TeacherTemplatesPage />} />
            <Route path="exam-templates/:templateId" element={<TeacherExamInstancesPage />} />
          </Route>


        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;