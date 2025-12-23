// src/pages/Teacher/TeacherClassesPage.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import teacherService from '../../services/teacherService';
import styles from './TeacherClassesPage.module.scss';

const TeacherClassesPage = () => {
    // KHÔNG CẦN AuthContext hay TopHeader nữa vì Layout đã lo

    // --- STATE DỮ LIỆU ---
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- STATE MODAL ---
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. LẤY DANH SÁCH LỚP
    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const res = await teacherService.getClasses();
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

    // 2. XỬ LÝ NHẬP LIỆU
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 3. TẠO LỚP MỚI
    const handleCreateClass = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await teacherService.createClass(formData);
            const newClass = res.data.newClass;
            setClasses([newClass, ...classes]);
            alert(res.data.message || "Tạo lớp thành công!");
            setFormData({ name: '', description: '' });
            setShowModal(false);
        } catch (error) {
            alert(error.response?.data?.error || "Tạo lớp thất bại!");
        } finally {
            setIsSubmitting(false);
        }
    };

    // 4. XÓA LỚP
    const handleDeleteClass = async (classId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa lớp học này không?")) return;
        try {
            await teacherService.deleteClass(classId);
            setClasses((prevClasses) => prevClasses.filter(cls => cls.id !== classId));
            alert("Xóa lớp học thành công!");
        } catch (error) {
            alert("Xóa lớp học thất bại");
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    return (
        // CHỈ GIỮ LẠI PHẦN NỘI DUNG CHÍNH (CONTENT BODY)
        <div className={styles.contentBody}>
            <div className={styles.pageHeader}>
                <h2>Danh sách lớp học của tôi</h2>
                <button className={styles.createBtn} onClick={() => setShowModal(true)}>
                    + Tạo lớp mới
                </button>
            </div>

            {loading ? (
                <p style={{ textAlign: 'center', marginTop: '20px' }}>Đang tải dữ liệu...</p>
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

            {/* --- MODAL (POPUP) --- */}
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