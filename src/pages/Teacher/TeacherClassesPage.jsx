// src/pages/Teacher/TeacherClassesPage.jsx
import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import teacherService from '../../services/teacherService';
import styles from './TeacherClassesPage.module.scss';
import { Link } from 'react-router-dom';

const TeacherClassesPage = () => {
    const { user, logout } = useContext(AuthContext);

    // State dữ liệu
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    // State cho Modal Tạo lớp
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- 1. LẤY DANH SÁCH LỚP (Endpoint 8) ---
    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const res = await teacherService.getClasses();
                // Sắp xếp lớp mới nhất lên đầu (nếu API chưa sắp xếp)
                const sortedClasses = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                setClasses(sortedClasses);
            } catch (error) {
                console.error("Lỗi tải lớp học:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchClasses();
    }, []);

    // --- 2. XỬ LÝ NHẬP LIỆU FORM ---
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- 3. GỌI API TẠO LỚP (Endpoint 7) ---
    const handleCreateClass = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await teacherService.createClass(formData);

            // API trả về: { newClass: {...}, message: "..." }
            const newClass = res.data.newClass;

            // Cập nhật giao diện ngay lập tức (Thêm vào đầu danh sách)
            setClasses([newClass, ...classes]);

            // Thông báo và Reset
            alert(res.data.message || "Tạo lớp thành công!");
            setFormData({ name: '', description: '' });
            setShowModal(false);

        } catch (error) {
            alert(error.response?.data?.error || "Tạo lớp thất bại!");
        } finally {
            setIsSubmitting(false);
        }
    };
    // ---4.  Xóa lớp (Endpoint 11)
    const handleDeleteClass = async (classId) => {
        // 1. Xác nhận trước khi xóa
        if (!window.confirm("Bạn có chắc chắn muốn xóa lớp học này không? Hành động này không thể hoàn tác.")) {
            return;
        }

        try {
            // 2. Gọi API Xóa (Endpoint 11)
            await teacherService.deleteClass(classId);

            // 3. Cập nhật giao diện: Lọc bỏ lớp vừa xóa khỏi danh sách hiện tại
            setClasses((prevClasses) => prevClasses.filter(cls => cls.id !== classId));

            alert("Xóa lớp học thành công!");
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || "Xóa lớp học thất bại");
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    return (
        <div className={styles.layout}>
            {/* SIDEBAR */}
            <aside className={styles.sidebar}>
                <div className={styles.logo}>EduTest <span>GV</span></div>
                <nav className={styles.nav}>
                    <Link to="/teacher/dashboard">Tổng quan</Link>
                    <Link to="/teacher/classes" className={styles.active}>Quản lý Lớp học</Link>
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
                    <h3>Quản lý Lớp học</h3>
                    <div className={styles.profile}>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ display: 'block' }}>Xin chào, <strong>{user?.name}</strong></span>
                            <span style={{ fontSize: '0.8rem', color: '#666' }}>{user?.email}</span>
                        </div>
                        <div className={styles.avatar}>GV</div>
                    </div>
                </header>

                <div className={styles.contentBody}>
                    <div className={styles.pageHeader}>
                        <h2>Danh sách lớp học của tôi</h2>
                        {/* NÚT MỞ MODAL */}
                        <button className={styles.createBtn} onClick={() => setShowModal(true)}>
                            + Tạo lớp mới
                        </button>
                    </div>

                    {loading ? (
                        <p>Đang tải dữ liệu...</p>
                    ) : classes.length > 0 ? (
                        <div className={styles.tableContainer}>
                            <table className={styles.classTable}>
                                <thead>
                                    <tr>
                                        <th>STT</th>
                                        <th>Tên lớp</th>
                                        <th>Mã lớp</th>
                                        <th>Mô tả</th>
                                        <th>Ngày tạo</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {classes.map((cls, index) => (
                                        <tr key={cls.id}>
                                            <td>{index + 1}</td>
                                            <td className={styles.className}>
                                                {/* Bấm vào tên lớp -> Chuyển trang */}
                                                <Link to={`/teacher/classes/${cls.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                    {cls.name}
                                                </Link>
                                            </td>
                                            <td><span className={styles.codeTag}>{cls.code}</span></td>
                                            <td>{cls.description}</td>
                                            <td>{formatDate(cls.created_at)}</td>
                                            <td>
                                                <Link to={`/teacher/classes/${cls.id}`} className={styles.actionBtn}>
                                                    Chi tiết
                                                </Link>
                                                <button
                                                    className={`${styles.actionBtn} ${styles.delete}`}
                                                    onClick={() => handleDeleteClass(cls.id)}
                                                >
                                                    Xóa
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <p>Bạn chưa có lớp học nào.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODAL (POPUP) TẠO LỚP --- */}
            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h3>Tạo Lớp Học Mới</h3>
                            <button className={styles.closeBtn} onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleCreateClass}>
                            <div className={styles.formGroup}>
                                <label>Tên lớp học <span style={{ color: 'red' }}>*</span></label>
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

export default TeacherClassesPage;