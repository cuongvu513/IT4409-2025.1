// src/pages/Admin/AdminDashboardPage.jsx
import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import styles from './AdminDashboardPage.module.scss'; // Tạo file css ở bước 3

const AdminDashboardPage = () => {
    // State lưu trữ dữ liệu thống kê
    const [stats, setStats] = useState({
        users: { total: 0 },
        classes: { total: 0 },
        exams: { total: 0, active: 0, upcoming: 0 },
        submissions: { today: 0 }
    });
    const [loading, setLoading] = useState(true);

    // --- LOAD DATA TỪ API ---
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await adminService.getDashboardStats();
                setStats(res.data);
            } catch (error) {
                console.error("Lỗi tải dashboard admin:", error);
            } finally {
                setLoading(false);
            }
        };
        setLoading(true);
        fetchStats();
        const intervalId = setInterval(fetchStats, 5000);
        return () => clearInterval(intervalId);

    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.pageHeader}>
                <h2>Tổng quan hệ thống</h2>
                <p>Cập nhật số liệu mới nhất ngày {new Date().toLocaleDateString('vi-VN')}</p>
            </div>

            {loading ? (
                <p>Đang tải dữ liệu...</p>
            ) : (
                <div className={styles.statsGrid}>
                    {/* CARD 1: NGƯỜI DÙNG */}
                    <div className={`${styles.card} ${styles.blue}`}>
                        <div className={styles.cardIcon}>
                            <i className="fa-solid fa-users"></i>
                        </div>
                        <div className={styles.cardContent}>
                            <h3>{stats.users.total}</h3>
                            <p>Tổng người dùng</p>
                        </div>
                    </div>

                    {/* CARD 2: LỚP HỌC */}
                    <div className={`${styles.card} ${styles.green}`}>
                        <div className={styles.cardIcon}>
                            <i className="fa-solid fa-chalkboard-user"></i>
                        </div>
                        <div className={styles.cardContent}>
                            <h3>{stats.classes.total}</h3>
                            <p>Lớp học hoạt động</p>
                        </div>
                    </div>

                    {/* CARD 3: BÀI NỘP HÔM NAY */}
                    <div className={`${styles.card} ${styles.orange}`}>
                        <div className={styles.cardIcon}>
                            <i className="fa-solid fa-file-arrow-up"></i>
                        </div>
                        <div className={styles.cardContent}>
                            <h3>{stats.submissions.today}</h3>
                            <p>Bài nộp hôm nay</p>
                        </div>
                    </div>

                    {/* CARD 4: KỲ THI (Chi tiết hơn) */}
                    <div className={`${styles.card} ${styles.purple} ${styles.wide}`}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardIcon}>
                                <i className="fa-solid fa-file-pen"></i>
                            </div>
                            <div className={styles.cardTitle}>
                                <h3>{stats.exams.total}</h3>
                                <p>Tổng số kỳ thi</p>
                            </div>
                        </div>
                        <div className={styles.cardDetails}>
                            <div className={styles.detailItem}>
                                <span className={styles.dotActive}></span>
                                <span>Đang diễn ra: <strong>{stats.exams.active}</strong></span>
                            </div>
                            <div className={styles.detailItem}>
                                <span className={styles.dotUpcoming}></span>
                                <span>Sắp tới: <strong>{stats.exams.upcoming}</strong></span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Khu vực biểu đồ hoặc danh sách mới nhất (Placeholder) */}
            <div className={styles.section}>
                <h3>Hoạt động gần đây</h3>
                <div className={styles.emptyState}>
                    Chưa có log hoạt động nào.
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;