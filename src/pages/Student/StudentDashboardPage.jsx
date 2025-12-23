// src/pages/Student/StudentDashboardPage.jsx
import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// KHÔNG import TopHeader nữa vì Layout đã có
import { AuthContext } from '../../context/AuthContext';
import studentService from '../../services/studentService';
import styles from './StudentDashboardPage.module.scss';

const StudentDashboardPage = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext); // Chỉ cần lấy user để hiện tên

    // --- STATE CHO MODAL THAM GIA LỚP ---
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ classCode: '', note: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- XỬ LÝ NHẬP LIỆU ---
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- GỌI API ENROLL (Endpoint 1) ---
    const handleEnroll = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await studentService.enrollClass(formData);
            alert(res.data.message || "Đã gửi yêu cầu tham gia thành công!");
            setFormData({ classCode: '', note: '' });
            setShowModal(false);
        } catch (error) {
            alert(error.response?.data?.error || "Tham gia thất bại. Vui lòng kiểm tra lại mã lớp!");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getFirstName = (name) => {
        if (!name) return 'Học viên';
        const parts = name.split(' ');
        return parts[parts.length - 1];
    };

    return (
        // XÓA LAYOUT, SIDEBAR, HEADER. CHỈ GIỮ NỘI DUNG CHÍNH
        <div className={styles.contentBody}>

            {/* Banner chào mừng */}
            <div className={styles.welcomeBanner}>
                <h1>Chào mừng trở lại, {getFirstName(user?.name)}! 👋</h1>
                <p>Chúc bạn một ngày học tập hiệu quả.</p>
            </div>

            {/* Thống kê */}
            <div className={styles.statsGrid}>
                <div className={styles.card}><h3>0</h3><p>Bài thi đã làm</p></div>
                <div className={styles.card}><h3>0</h3><p>Bài thi sắp tới</p></div>
                <div className={styles.card}><h3>--</h3><p>Điểm trung bình</p></div>
            </div>

            {/* Khu vực danh sách lớp */}
            <div className={styles.contentSection}>
                <div className={styles.sectionHeader}>
                    <h2>Lớp học của tôi</h2>
                    <Link to="/student/classes" className={styles.viewMore}>Xem tất cả</Link>
                </div>

                <div className={styles.emptyState}>
                    <p>Bạn chưa tham gia lớp học nào.</p>
                    {/* NÚT MỞ MODAL */}
                    <button
                        className={styles.primaryBtn}
                        onClick={() => setShowModal(true)}
                    >
                        + Tham gia lớp mới
                    </button>
                </div>
            </div>

            {/* --- MODAL (POPUP) NHẬP MÃ LỚP --- */}
            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h3>Tham gia lớp học</h3>
                            <button className={styles.closeBtn} onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleEnroll}>
                            <div className={styles.formGroup}>
                                <label>Mã lớp (Class Code) <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="text"
                                    name="classCode"
                                    placeholder="Ví dụ: wyld1h50"
                                    value={formData.classCode}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Lời nhắn cho giáo viên</label>
                                <textarea
                                    name="note"
                                    placeholder="Em tên là... Xin thầy/cô cho em vào lớp ạ."
                                    value={formData.note}
                                    onChange={handleChange}
                                    rows="3"
                                ></textarea>
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" className={styles.btnCancel} onClick={() => setShowModal(false)}>Hủy</button>
                                <button type="submit" className={styles.btnSubmit} disabled={isSubmitting}>
                                    {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboardPage;