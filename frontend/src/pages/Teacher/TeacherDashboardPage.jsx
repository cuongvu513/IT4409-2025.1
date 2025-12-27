// src/pages/Teacher/TeacherDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import teacherService from '../../services/teacherService';
import styles from './TeacherDashboardPage.module.scss';

const TeacherDashboardPage = () => {

    // --- STATE DỮ LIỆU DASHBOARD ---
    const [stats, setStats] = useState({
        totalClasses: 0,
        totalStudents: 0,
        totalExams: 0,
        totalQuestions: 0,
        totalTemplates: 0
    });
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- STATE QUẢN LÝ MODAL TẠO LỚP ---
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- 1. LOAD DỮ LIỆU TỪ API ---
    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await teacherService.getDashboardData();
                const data = res.data;

                // Cập nhật State
                if (data.stats) setStats(data.stats);
                if (data.recentActivities) setActivities(data.recentActivities);
            } catch (error) {
                console.error("Lỗi tải dashboard:", error);
            } finally {
                setLoading(false);
            }
        };
        setLoading(true);
        fetchDashboard();
        const intervalId = setInterval(fetchDashboard, 5000);
        return () => clearInterval(intervalId);
    }, []);

    // --- HELPER: FORMAT NGÀY GIỜ ---
    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleString('vi-VN', {
            hour: '2-digit', minute: '2-digit',
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    // --- HELPER: ICON VÀ MÀU SẮC CHO HOẠT ĐỘNG ---
    const getActivityConfig = (type) => {
        switch (type) {
            case 'create_class':
                return { icon: 'fa-chalkboard-user', color: '#28a745', label: 'Lớp học' };
            case 'create_question':
                return { icon: 'fa-circle-question', color: '#17a2b8', label: 'Câu hỏi' };
            case 'create_exam_instance':
                return { icon: 'fa-file-pen', color: '#ffc107', label: 'Đề thi' };
            default:
                return { icon: 'fa-bell', color: '#6c757d', label: 'Hoạt động' };
        }
    };

    // Hàm xử lý nhập liệu
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Hàm gọi API Tạo lớp
    const handleCreateClass = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await teacherService.createClass(formData);
            alert(res.data.message || 'Tạo lớp thành công!');

            setFormData({ name: '', description: '' });
            setShowModal(false);
        } catch (error) {
            alert(error.response?.data?.error || 'Tạo lớp thất bại!');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        // CHỈ GIỮ LẠI PHẦN NỘI DUNG CHÍNH (CONTENT BODY)
        <div className={styles.contentBody}>

            {/* Banner chào mừng */}
            <div className={styles.welcomeHero}>
                <div className={styles.heroContent}>
                    <h2>Chào mừng giáo viên đến với trang quản lý học sinh! 👋</h2>
                    <p>Chúc thầy cô một ngày làm việc hiệu quả và tràn đầy năng lượng.</p>
                </div>
                <div className={styles.heroIcon}>
                    <i className="fa-solid fa-chalkboard-user"></i>
                </div>
            </div>

            {/* --- 2. HIỂN THỊ THỐNG KÊ (STATS) --- */}
            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <h4>Lớp học</h4>
                    <p>{stats.totalClasses}</p>
                    <i className="fa-solid fa-chalkboard-user" style={{ color: '#e3f2fd' }}></i>
                </div>
                <div className={styles.statCard}>
                    <h4>Học sinh</h4>
                    <p>{stats.totalStudents}</p>
                    <i className="fa-solid fa-users" style={{ color: '#e8f5e9' }}></i>
                </div>
                <div className={styles.statCard}>
                    <h4>Đề thi</h4>
                    <p>{stats.totalExams}</p>
                    <i className="fa-solid fa-file-pen" style={{ color: '#fff3e0' }}></i>
                </div>
                {/* Thêm thẻ Câu hỏi nếu muốn */}
                <div className={styles.statCard}>
                    <h4>Câu hỏi</h4>
                    <p>{stats.totalQuestions}</p>
                    <i className="fa-solid fa-database" style={{ color: '#f3e5f5' }}></i>
                </div>
            </div>

            {/* --- 3. HIỂN THỊ HOẠT ĐỘNG GẦN ĐÂY --- */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3>Hoạt động gần đây</h3>
                    <button className={styles.createBtn} onClick={() => setShowModal(true)}>
                        + Tạo lớp học mới
                    </button>
                </div>

                <div className={styles.activityList}>
                    {loading ? (
                        <p className={styles.loadingText}>Đang tải dữ liệu...</p>
                    ) : activities.length > 0 ? (
                        activities.map((act) => {
                            const config = getActivityConfig(act.type);
                            return (
                                <div key={act.id} className={styles.activityItem}>
                                    <div className={styles.actIcon} style={{ backgroundColor: config.color }}>
                                        <i className={`fa-solid ${config.icon}`}></i>
                                    </div>
                                    <div className={styles.actContent}>
                                        <p className={styles.actDesc}>{act.description}</p>
                                        <span className={styles.actTime}>{formatDate(act.timestamp)}</span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className={styles.emptyText}>Chưa có hoạt động nào.</p>
                    )}
                </div>
            </div>

            {/* --- MODAL TẠO LỚP (GIỮ NGUYÊN) --- */}
            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h3>Tạo Lớp Học Mới</h3>
                            <button className={styles.closeBtn} onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleCreateClass}>
                            <div className={styles.formGroup}>
                                <label>Tên lớp học</label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="VD: Tin học đại cương"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Mô tả</label>
                                <textarea
                                    name="description"
                                    placeholder="VD: Học sáng thứ 6..."
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="3"
                                ></textarea>
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" className={styles.btnCancel} onClick={() => setShowModal(false)}>Hủy</button>
                                <button type="submit" className={styles.btnSubmit} disabled={isSubmitting}>
                                    {isSubmitting ? 'Đang tạo...' : 'Xác nhận tạo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherDashboardPage;