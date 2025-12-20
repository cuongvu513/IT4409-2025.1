// src/pages/Student/StudentDashboardPage.jsx
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import TopHeader from '../../components/TopHeader'; // 1. Import TopHeader
import { AuthContext } from '../../context/AuthContext';
import styles from './StudentDashboardPage.module.scss';

const StudentDashboardPage = () => {
    const navigate = useNavigate();

    // Chỉ cần lấy user để hiển thị ở Banner chào mừng
    // (TopHeader đã tự lấy user và xử lý logout bên trong nó rồi)
    const { user } = useContext(AuthContext);

    // Hàm lấy tên hiển thị
    const getFirstName = (name) => {
        if (!name) return 'Học viên';
        const parts = name.split(' ');
        return parts[parts.length - 1];
    };

    return (
        <div className={styles.container}>
            {/* 2. SỬ DỤNG TOPHEADER (Thay thế toàn bộ thẻ header cũ) */}
            <TopHeader title="EduTest - Học Sinh" />

            {/* NỘI DUNG CHÍNH */}
            <main className={styles.main}>
                {/* Banner chào mừng */}
                <section className={styles.welcomeBanner}>
                    <h1>Chào mừng trở lại, {getFirstName(user?.name)}! 👋</h1>
                    <p>Email tài khoản: {user?.email}</p>
                </section>

                {/* Thống kê */}
                <section className={styles.statsGrid}>
                    <div className={styles.card}>
                        <h3>0</h3>
                        <p>Bài thi đã làm</p>
                    </div>
                    <div className={styles.card}>
                        <h3>0</h3>
                        <p>Bài thi sắp tới</p>
                    </div>
                    <div className={styles.card}>
                        <h3>--</h3>
                        <p>Điểm trung bình</p>
                    </div>
                </section>

                {/* Danh sách lớp */}
                <section className={styles.contentSection}>
                    <h2>Danh sách lớp học</h2>
                    <div className={styles.emptyState}>
                        <p>Bạn chưa tham gia lớp học nào.</p>
                        <button className={styles.primaryBtn}>Tham gia lớp mới</button>
                    </div>
                </section>

                {/* Button làm bài test */}
                <button
                    className={styles.primaryBtn}
                    onClick={() => navigate('/student/exam')}
                    style={{ marginTop: '20px' }}
                >
                    📝 Làm bài test thử
                </button>
            </main>
        </div>
    );
};

export default StudentDashboardPage;