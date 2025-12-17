// src/pages/Student/StudentDashboardPage.jsx
import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import styles from './StudentDashboardPage.module.scss';
import { useNavigate, Outlet } from 'react-router-dom';

const StudentDashboardPage = () => {
    const navigate = useNavigate();
    const { user, logout } = useContext(AuthContext);

    // Hàm lấy tên hiển thị
    const getFirstName = (name) => {
        if (!name) return 'Học viên';
        const parts = name.split(' ');
        return parts[parts.length - 1];
    };

    return (
        <div className={styles.container}>
            {/* HEADER */}
            <header className={styles.header}>
                <div className={styles.brand}>EduTest - Học Sinh</div>
                <div className={styles.userSection}>
                    <div className={styles.userInfo}>
                        {/* Kiểm tra user tồn tại trước khi render */}
                        <span className={styles.userName}>{user?.name || 'Đang tải...'}</span>
                        <span className={styles.userRole}>Học sinh</span>
                    </div>
                    <button onClick={logout} className={styles.logoutBtn}>Đăng xuất</button>
                </div>
            </header>

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
                {/* Button de vao lam bai test */}
                <button
                    className={styles.primaryBtn}
                    onClick={() => navigate('/student/exam')}
                >
                    📝 Làm bài test thử
                </button>
            </main>
        </div>
    );
};

export default StudentDashboardPage;