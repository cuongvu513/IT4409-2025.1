// src/pages/Teacher/TeacherExamInstancesPage.jsx
import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import teacherService from '../../services/teacherService';
import styles from './TeacherExamInstancesPage.module.scss';
import TopHeader from '../../components/TopHeader'; // 1. Import TopHeader

const TeacherExamInstancesPage = () => {
    const { templateId } = useParams();
    // Chỉ cần logout cho Sidebar
    const { logout } = useContext(AuthContext);

    // Data State
    const [exams, setExams] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal & Form State
    const [showModal, setShowModal] = useState(false);
    const [editingExam, setEditingExam] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const initialForm = {
        starts_at: '',
        ends_at: '',
        published: false,
        selectedQuestionIds: []
    };
    const [formData, setFormData] = useState(initialForm);

    // --- 1. LOAD DATA ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [examRes, questRes] = await Promise.all([
                    teacherService.getExamInstancesByTemplate(templateId),
                    teacherService.getQuestions()
                ]);
                setExams(examRes.data);
                setQuestions(questRes.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [templateId]);

    // Helper Date
    const toInputDateTime = (isoString) => {
        if (!isoString) return '';
        return isoString.substring(0, 16);
    };
    const formatDate = (str) => new Date(str).toLocaleString('vi-VN');

    // --- LOGIC FORM ---
    const handleInputChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleQuestionToggle = (qId) => {
        setFormData(prev => {
            const current = prev.selectedQuestionIds;
            if (current.includes(qId)) return { ...prev, selectedQuestionIds: current.filter(id => id !== qId) };
            else return { ...prev, selectedQuestionIds: [...current, qId] };
        });
    };

    // --- CÁC HÀM XỬ LÝ (Create/Edit/Delete) ---
    const openCreateModal = () => {
        setEditingExam(null);
        setFormData(initialForm);
        setShowModal(true);
    };

    const openEditModal = (exam) => {
        setEditingExam(exam);
        const currentQuestionIds = exam.exam_question ? exam.exam_question.map(eq => eq.question_id) : [];
        setFormData({
            starts_at: toInputDateTime(exam.starts_at),
            ends_at: toInputDateTime(exam.ends_at),
            published: exam.published,
            selectedQuestionIds: currentQuestionIds
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa đề thi này không?")) return;
        try {
            await teacherService.deleteExamInstance(id);
            setExams(prev => prev.filter(e => e.id !== id));
            alert("Xóa thành công!");
        } catch (error) {
            alert(error.response?.data?.error || "Xóa thất bại");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const payload = {
            ...(editingExam ? {} : { templateId }),
            starts_at: new Date(formData.starts_at).toISOString(),
            ends_at: new Date(formData.ends_at).toISOString(),
            published: formData.published,
            questions: formData.selectedQuestionIds.map(id => ({ question_id: id }))
        };

        if (payload.questions.length === 0) { alert("Vui lòng chọn ít nhất 1 câu hỏi!"); setIsSubmitting(false); return; }

        try {
            if (editingExam) {
                const res = await teacherService.updateExamInstance(editingExam.id, payload);
                setExams(prev => prev.map(ex =>
                    ex.id === editingExam.id ? { ...ex, ...res.data.updatedInstance, title: ex.title } : ex
                ));
                alert(res.data.message);
            } else {
                const res = await teacherService.createExam(payload);
                const newExam = { ...res.data.newInstance, title: "Đề thi mới" };
                setExams([newExam, ...exams]);
                alert(res.data.message);
            }
            setShowModal(false);
        } catch (error) {
            alert(error.response?.data?.error || "Thất bại");
        } finally {
            setIsSubmitting(false);
        }
    };

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
                <TopHeader title="Quản lý Bài kiểm tra" />

                <div className={styles.contentBody}>
                    <div className={styles.backLink}>
                        <Link to="/teacher/exam-templates">← Quay lại danh sách Template</Link>
                    </div>

                    <div className={styles.pageHeader}>
                        <h2>Danh sách Đề thi (Instances)</h2>
                        <button className={styles.createBtn} onClick={openCreateModal}>+ Tạo Đề Thi</button>
                    </div>

                    {loading ? <p>Đang tải...</p> : (
                        <div className={styles.tableContainer}>
                            <table className={styles.dataTable}>
                                <thead>
                                    <tr>
                                        <th>ID Đề thi</th>
                                        <th>Bắt đầu</th>
                                        <th>Kết thúc</th>
                                        <th>Trạng thái</th>
                                        <th>Ngày tạo</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {exams.length > 0 ? exams.map(exam => (
                                        <tr key={exam.id}>
                                            <td style={{ fontFamily: 'monospace', color: '#007bff' }}>
                                                {exam.title || exam.id.substring(0, 8)}
                                            </td>
                                            <td>{formatDate(exam.starts_at)}</td>
                                            <td>{formatDate(exam.ends_at)}</td>
                                            <td>
                                                <span className={`${styles.badge} ${exam.published ? styles.pub : styles.draft}`}>
                                                    {exam.published ? 'Công bố' : 'Nháp'}
                                                </span>
                                            </td>
                                            <td>{formatDate(exam.created_at)}</td>
                                            <td>
                                                <div className={styles.actionButtons}>
                                                    <button className={`${styles.btnIcon} ${styles.btnEdit}`} onClick={() => openEditModal(exam)} title="Sửa">
                                                        <i className="fa-solid fa-pen"></i>
                                                    </button>
                                                    <button className={`${styles.btnIcon} ${styles.btnDelete}`} onClick={() => handleDelete(exam.id)} title="Xóa">
                                                        <i className="fa-solid fa-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="6" align="center">Chưa có đề thi nào.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL (GIỮ NGUYÊN) */}
            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h3>{editingExam ? 'Chỉnh sửa Đề Thi' : 'Tạo Đề Thi Mới'}</h3>
                            <button onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.formScroll}>
                            <div className={styles.row}>
                                <div className={styles.formGroup}>
                                    <label>Bắt đầu *</label>
                                    <input type="datetime-local" name="starts_at" value={formData.starts_at} onChange={handleInputChange} required />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Kết thúc *</label>
                                    <input type="datetime-local" name="ends_at" value={formData.ends_at} onChange={handleInputChange} required />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.checkboxLabel}>
                                    <input type="checkbox" name="published" checked={formData.published} onChange={handleInputChange} />
                                    Công bố ngay
                                </label>
                            </div>

                            <div className={styles.questionSection}>
                                <h4>Chọn câu hỏi ({formData.selectedQuestionIds.length})</h4>
                                <div className={styles.questionList}>
                                    {questions.length === 0 ? <p>Ngân hàng câu hỏi trống.</p> :
                                        questions.map(q => (
                                            <div key={q.id} className={styles.qItem}>
                                                <input type="checkbox" id={`q-${q.id}`} checked={formData.selectedQuestionIds.includes(q.id)} onChange={() => handleQuestionToggle(q.id)} />
                                                <label htmlFor={`q-${q.id}`}>
                                                    <span className={`${styles.badge} ${styles.gray}`}>{q.difficulty}</span>
                                                    {q.text}
                                                </label>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" className={styles.btnCancel} onClick={() => setShowModal(false)}>Hủy</button>
                                <button type="submit" className={styles.btnSubmit} disabled={isSubmitting}>
                                    {isSubmitting ? 'Đang xử lý...' : (editingExam ? 'Cập nhật' : 'Tạo mới')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherExamInstancesPage;