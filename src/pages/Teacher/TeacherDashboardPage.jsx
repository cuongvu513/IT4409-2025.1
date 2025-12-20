// src/pages/Teacher/TeacherDashboardPage.jsx
import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './TeacherDashboardPage.module.scss';

// 1. Import Component và Context
import TopHeader from '../../components/TopHeader';
import { AuthContext } from '../../context/AuthContext';
import teacherService from '../../services/teacherService';

const TeacherDashboardPage = () => {
    // Chỉ cần lấy logout cho Sidebar, còn user và fetchUserProfile đã có TopHeader lo
    const { logout } = useContext(AuthContext);

    // --- STATE QUẢN LÝ MODAL TẠO LỚP ---
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        <div className={styles.layout}>
            {/* --- SIDEBAR (Giữ nguyên) --- */}
            <aside className={styles.sidebar}>
                <div className={styles.logo}>EduTest <span>GV</span></div>
                <nav className={styles.nav}>
                    <Link to="/teacher/dashboard" className={styles.active}>Tổng quan</Link>
                    <Link to="/teacher/classes">Quản lý Lớp học</Link>
                    <Link to="/teacher/questions">Ngân hàng câu hỏi</Link>
                    <Link to="/teacher/exam-templates">Mẫu đề thi</Link>
                </nav>
                <div className={styles.sidebarFooter}>
                    <button onClick={logout}>Đăng xuất</button>
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <div className={styles.mainContent}>

                {/* 2. SỬ DỤNG COMPONENT TOPHEADER (Thay thế code header cũ) */}
                <TopHeader title="Dashboard" />

                <div className={styles.contentBody}>
                    <div className={styles.welcomeHero}>
                        <div className={styles.heroContent}>
                            <h2>Chào mừng giáo viên đến với trang quản lý học sinh!</h2>
                            <p>Chúc thầy cô một ngày làm việc hiệu quả và tràn đầy năng lượng.</p>
                        </div>
                        <div className={styles.heroIcon}>
                            <i className="fa-solid fa-chalkboard-user"></i>
                        </div>
                    </div>

                    <div className={styles.statsRow}>
                        <div className={styles.statCard}><h4>Lớp học</h4><p>0</p></div>
                        <div className={styles.statCard}><h4>Học sinh</h4><p>0</p></div>
                        <div className={styles.statCard}><h4>Đề thi</h4><p>0</p></div>
                    </div>

                    <div className={styles.section}>
                        <h3>Hoạt động gần đây</h3>
                        <p style={{ color: '#666' }}>Chưa có hoạt động nào.</p>

                        <button className={styles.createBtn} onClick={() => setShowModal(true)}>
                            + Tạo lớp học mới
                        </button>
                    </div>
                </div>
            </div>

            {/* --- MODAL TẠO LỚP --- */}
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