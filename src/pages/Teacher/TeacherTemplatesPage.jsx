// src/pages/Teacher/TeacherTemplatesPage.jsx
import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import teacherService from '../../services/teacherService';
import styles from './TeacherTemplatesPage.module.scss';
import { Link } from 'react-router-dom';
import TopHeader from '../../components/TopHeader'; // 1. Import TopHeader

const TeacherTemplatesPage = () => {
    // Chỉ cần logout cho Sidebar
    const { logout } = useContext(AuthContext);

    // State Data
    const [templates, setTemplates] = useState([]);
    const [classList, setClassList] = useState([]);
    const [loading, setLoading] = useState(true);

    // State Tìm kiếm
    const [keyword, setKeyword] = useState('');

    // State Modal & Form
    const [showModal, setShowModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const initialForm = {
        title: '', description: '', class_id: '',
        duration_minutes: '', passing_score: '', shuffle_questions: false
    };
    const [formData, setFormData] = useState(initialForm);

    // --- 1. LOAD DỮ LIỆU ---
    const loadTemplates = async () => {
        try {
            setLoading(true);
            let res;
            if (keyword.trim()) {
                res = await teacherService.searchExamTemplates(keyword);
            } else {
                res = await teacherService.getExamTemplates();
            }
            setTemplates(res.data);
        } catch (error) {
            console.error("Lỗi tải template:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTemplates();
        const fetchClasses = async () => {
            try {
                const res = await teacherService.getClasses();
                setClassList(res.data);
            } catch (err) { console.error(err); }
        };
        fetchClasses();
    }, []);

    // --- 2. XỬ LÝ TÌM KIẾM ---
    const handleSearch = (e) => {
        e.preventDefault();
        loadTemplates();
    };

    // --- 3. XỬ LÝ INPUT FORM ---
    const handleInputChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    // Mở Modal Tạo mới
    const openCreateModal = () => {
        setEditingTemplate(null);
        setFormData(initialForm);
        setShowModal(true);
    };

    // Mở Modal Sửa
    const openEditModal = (tpl) => {
        setEditingTemplate(tpl);
        setFormData({
            title: tpl.title,
            description: tpl.description,
            class_id: tpl.class_id,
            duration_minutes: Math.floor(tpl.duration_seconds / 60),
            passing_score: tpl.passing_score,
            shuffle_questions: tpl.shuffle_questions
        });
        setShowModal(true);
    };

    // --- 4. SUBMIT FORM ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const payload = {
            title: formData.title,
            description: formData.description,
            class_id: formData.class_id,
            duration_seconds: parseInt(formData.duration_minutes) * 60,
            passing_score: parseInt(formData.passing_score),
            shuffle_questions: formData.shuffle_questions
        };

        try {
            if (editingTemplate) {
                const res = await teacherService.updateExamTemplate(editingTemplate.id, payload);
                alert(res.data.message);
                setTemplates(prev => prev.map(t =>
                    t.id === editingTemplate.id ? res.data.updatedTemplate : t
                ));
            } else {
                const res = await teacherService.createExamTemplate(payload);
                alert(res.data.message);
                if (res.data.newTemplate) {
                    setTemplates([res.data.newTemplate, ...templates]);
                } else {
                    loadTemplates();
                }
            }
            setShowModal(false);
        } catch (error) {
            alert(error.response?.data?.error || "Có lỗi xảy ra!");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- 5. XÓA ---
    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa mẫu đề thi này?")) return;
        try {
            const res = await teacherService.deleteExamTemplate(id);
            setTemplates(prev => prev.filter(t => t.id !== id));
            alert(res.data.message);
        } catch (error) {
            alert(error.response?.data?.error || "Xóa thất bại");
        }
    };

    const formatTime = (seconds) => `${Math.floor(seconds / 60)} phút`;

    return (
        <div className={styles.layout}>
            {/* SIDEBAR (GIỮ NGUYÊN) */}
            <aside className={styles.sidebar}>
                <div className={styles.logo}>EduTest <span>GV</span></div>
                <nav className={styles.nav}>
                    <Link to="/teacher/dashboard">Tổng quan</Link>
                    <Link to="/teacher/classes">Quản lý Lớp học</Link>
                    <Link to="/teacher/questions">Ngân hàng câu hỏi</Link>
                    <Link to="/teacher/exam-templates" className={styles.active}>Mẫu đề thi</Link>
                </nav>
                <div className={styles.sidebarFooter}><button onClick={logout}>Đăng xuất</button></div>
            </aside>

            {/* MAIN CONTENT */}
            <div className={styles.mainContent}>

                {/* 2. DÙNG TOPHEADER */}
                <TopHeader title="Quản lý Mẫu đề thi" />

                <div className={styles.contentBody}>
                    <div className={styles.pageHeader}>
                        {/* Search Box */}
                        <form onSubmit={handleSearch} className={styles.searchBox}>
                            <input
                                type="text"
                                placeholder="Tìm kiếm mẫu đề..."
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                            />
                            <button type="submit"><i className="fa-solid fa-magnifying-glass"></i></button>
                        </form>

                        <button className={styles.createBtn} onClick={openCreateModal}>+ Tạo Mẫu mới</button>
                    </div>

                    {loading ? <p>Đang tải...</p> : (
                        <div className={styles.tableContainer}>
                            <table className={styles.dataTable}>
                                <thead>
                                    <tr>
                                        <th>Tiêu đề</th>
                                        <th>Mô tả</th>
                                        <th>Thời gian</th>
                                        <th>Điểm đạt</th>
                                        <th>Đảo câu</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {templates.length > 0 ? templates.map(tpl => (
                                        <tr key={tpl.id}>
                                            <td>
                                                <Link
                                                    to={`/teacher/exam-templates/${tpl.id}`}
                                                    style={{ color: '#007bff', fontWeight: 'bold', textDecoration: 'none' }}
                                                >
                                                    {tpl.title}
                                                </Link>
                                            </td>
                                            <td style={{ maxWidth: '250px' }}>{tpl.description}</td>
                                            <td>{formatTime(tpl.duration_seconds)}</td>
                                            <td>{tpl.passing_score}</td>
                                            <td>
                                                {tpl.shuffle_questions
                                                    ? <span className={styles.tagYes}>Có</span>
                                                    : <span className={styles.tagNo}>Không</span>}
                                            </td>
                                            <td>
                                                <div className={styles.actionButtons}>
                                                    <button
                                                        className={`${styles.btnIcon} ${styles.btnEdit}`}
                                                        onClick={() => openEditModal(tpl)}
                                                        title="Sửa"
                                                    >
                                                        <i className="fa-solid fa-pen"></i>
                                                    </button>

                                                    <button
                                                        className={`${styles.btnIcon} ${styles.btnDelete}`}
                                                        onClick={() => handleDelete(tpl.id)}
                                                        title="Xóa"
                                                    >
                                                        <i className="fa-solid fa-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="6" style={{ textAlign: 'center' }}>Không tìm thấy mẫu đề thi nào.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL */}
            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h3>{editingTemplate ? 'Cập nhật Template' : 'Tạo Template Mới'}</h3>
                            <button onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.formScroll}>
                            <div className={styles.formGroup}>
                                <label>Tiêu đề *</label>
                                <input name="title" value={formData.title} onChange={handleInputChange} required />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Mô tả</label>
                                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="2" />
                            </div>
                            <div className={styles.row}>
                                <div className={styles.formGroup}>
                                    <label>Lớp áp dụng *</label>
                                    <select name="class_id" value={formData.class_id} onChange={handleInputChange} required>
                                        <option value="">-- Chọn lớp --</option>
                                        {classList.map(cls => (
                                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Thời gian (Phút) *</label>
                                    <input type="number" name="duration_minutes" value={formData.duration_minutes} onChange={handleInputChange} required min="1" />
                                </div>
                            </div>
                            <div className={styles.row}>
                                <div className={styles.formGroup}>
                                    <label>Điểm đạt</label>
                                    <input type="number" name="passing_score" value={formData.passing_score} onChange={handleInputChange} />
                                </div>
                                <div className={styles.formGroup} style={{ marginTop: '30px' }}>
                                    <label className={styles.checkboxLabel}>
                                        <input type="checkbox" name="shuffle_questions" checked={formData.shuffle_questions} onChange={handleInputChange} />
                                        Đảo câu hỏi
                                    </label>
                                </div>
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" className={styles.btnCancel} onClick={() => setShowModal(false)}>Hủy</button>
                                <button type="submit" className={styles.btnSubmit} disabled={isSubmitting}>
                                    {isSubmitting ? 'Đang xử lý...' : (editingTemplate ? 'Cập nhật' : 'Lưu mới')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherTemplatesPage;