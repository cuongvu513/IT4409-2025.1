// src/pages/Teacher/TeacherDashboardPage.jsx
import React, { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import teacherService from '../../services/teacherService'; // Import Service
import styles from './TeacherDashboardPage.module.scss';
import { Link } from 'react-router-dom';

const TeacherDashboardPage = () => {
    const { user, logout } = useContext(AuthContext);

    // --- 1. STATE QUẢN LÝ MODAL & FORM ---
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- 2. HÀM XỬ LÝ NHẬP LIỆU ---
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- 3. HÀM GỌI API TẠO LỚP ---
    const handleCreateClass = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Gọi API Endpoint 7
            const res = await teacherService.createClass(formData);

            // Thành công
            alert(res.data.message || 'Tạo lớp thành công!');
            console.log("Class Created:", res.data.newClass);

            // Reset form và đóng modal
            setFormData({ name: '', description: '' });
            setShowModal(false);

            // (Tuỳ chọn) Ở đây bạn có thể gọi lại API lấy danh sách lớp để cập nhật UI
        } catch (error) {
            alert(error.response?.data?.error || 'Tạo lớp thất bại!');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.layout}>
            {/* SIDEBAR GIỮ NGUYÊN */}
            <aside className={styles.sidebar}>
                <div className={styles.logo}>EduTest <span>GV</span></div>
                <nav className={styles.nav}>
                    <Link to="/teacher/dashboard" className={styles.active}>Tổng quan</Link>
                    <Link to="/teacher/classes">Quản lý Lớp học</Link>
                    <Link to="/teacher/questions">Ngân hàng câu hỏi</Link>
                    <Link to="/teacher/exams">Bài kiểm tra</Link>
                </nav>
                <div className={styles.sidebarFooter}>
                    <button onClick={logout}>Đăng xuất</button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <div className={styles.mainContent}>
                <header className={styles.topHeader}>
                    <h3>Dashboard</h3>
                    <div className={styles.profile}>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ display: 'block' }}>Xin chào, <strong>{user?.name}</strong></span>
                            <span style={{ fontSize: '0.8rem', color: '#666' }}>{user?.email}</span>
                        </div>
                        <div className={styles.avatar}>GV</div>
                    </div>
                </header>

                <div className={styles.contentBody}>
                    <div className={styles.statsRow}>
                        <div className={styles.statCard}><h4>Lớp học</h4><p>0</p></div>
                        <div className={styles.statCard}><h4>Học sinh</h4><p>0</p></div>
                        <div className={styles.statCard}><h4>Đề thi</h4><p>0</p></div>
                    </div>

                    <div className={styles.section}>
                        <h3>Hoạt động gần đây</h3>
                        <p style={{ color: '#666' }}>Chưa có hoạt động nào.</p>

                        {/* GẮN SỰ KIỆN MỞ MODAL VÀO NÚT NÀY */}
                        <button className={styles.createBtn} onClick={() => setShowModal(true)}>
                            + Tạo lớp học mới
                        </button>
                    </div>
                </div>
            </div>

            {/* --- 4. GIAO DIỆN MODAL (POPUP) --- */}
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