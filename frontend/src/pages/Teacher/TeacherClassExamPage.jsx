import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import teacherService from '../../services/teacherService';
import styles from './TeacherClassExamPage.module.scss';

const TeacherClassExamPage = () => {
  const { classId } = useParams();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await teacherService.getExamInstances(classId);
        setExams(res.data);
      } catch (err) {
        console.error(err);
        alert('Không thể tải danh sách bài thi');
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [classId]);

  return (
    <div className={styles.contentBody}>
      <h2>Quản lý bài thi của lớp</h2>

      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : exams.length === 0 ? (
        <p>Chưa có bài thi nào trong lớp.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Bắt đầu</th>
              <th>Kết thúc</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((exam, index) => (
              <tr key={exam.id}>
                <td>{index + 1}</td>
                <td>{new Date(exam.starts_at).toLocaleString('vi-VN')}</td>
                <td>{new Date(exam.ends_at).toLocaleString('vi-VN')}</td>
                <td>
                  {exam.published ? 'Đã công bố' : 'Nháp'}
                </td>
                <td>
                  <Link
                    to={`/teacher/classes/${classId}/exams/${exam.id}`}
                  >
                    Quản lý phiên thi
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TeacherClassExamPage;
