// src/pages/Teacher/TeacherQuestionsPage.jsx
import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import teacherService from '../../services/teacherService';
import styles from './TeacherQuestionsPage.module.scss';
import { Link } from 'react-router-dom';

const TeacherQuestionsPage = () => {
    const { user, logout } = useContext(AuthContext);

    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State để xác định đang sửa câu hỏi nào (null = tạo mới)
    const [editingQuestion, setEditingQuestion] = useState(null);

    const [viewQuestion, setViewQuestion] = useState(null);

    const initialFormState = {
        text: '',
        difficulty: 'easy',
        tags: '',
        explanation: '',
        choices: [
            { order: 1, text: '', is_correct: false },
            { order: 2, text: '', is_correct: false },
            { order: 3, text: '', is_correct: false },
            { order: 4, text: '', is_correct: false }
        ]
    };

    const [formData, setFormData] = useState(initialFormState);

    // 1. Load danh sách
    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const res = await teacherService.getQuestions();
                setQuestions(res.data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchQuestions();
    }, []);

    // Helper: Reset form
    const resetForm = () => {
        setFormData(initialFormState);
        setEditingQuestion(null);
        setShowModal(false);
    };

    // --- XỬ LÝ FORM (Nhập liệu) ---
    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleChoiceChange = (index, value) => {
        const newChoices = [...formData.choices];
        newChoices[index].text = value;
        setFormData({ ...formData, choices: newChoices });
    };

    const handleCorrectSelect = (index) => {
        const newChoices = formData.choices.map((c, i) => ({
            ...c,
            is_correct: i === index
        }));
        setFormData({ ...formData, choices: newChoices });
    };

    // --- LOGIC MỞ MODAL ĐỂ TẠO MỚI ---
    const handleOpenCreate = () => {
        setEditingQuestion(null); // Chế độ tạo mới
        setFormData(initialFormState);
        setShowModal(true);
    };

    // --- LOGIC MỞ MODAL ĐỂ SỬA (Endpoint 17) ---
    const handleEditClick = (question) => {
        setEditingQuestion(question); // Lưu câu hỏi đang sửa

        // Map dữ liệu từ API vào Form
        // Lưu ý: tags từ API là mảng ["math", "ly"], Form cần chuỗi "math, ly"
        // question_choice từ API cần map sang choices của Form
        setFormData({
            text: question.text,
            difficulty: question.difficulty,
            explanation: question.explanation || '',
            tags: question.tags.join(', '),
            choices: question.question_choice.map(c => ({
                order: c.order,
                text: c.text,
                is_correct: c.is_correct
            }))
        });

        setShowModal(true);
    };

    // --- LOGIC XÓA (Endpoint 18) ---
    const handleDeleteClick = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa câu hỏi này không?")) return;

        try {
            await teacherService.deleteQuestion(id);
            // Cập nhật UI: Lọc bỏ câu vừa xóa
            setQuestions(prev => prev.filter(q => q.id !== id));
            alert("Xóa thành công!");
        } catch (error) {
            alert("Xóa thất bại!");
        }
    };

    // --- SUBMIT FORM (Tạo mới HOẶC Cập nhật) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Chuẩn bị payload
        const payload = {
            ...formData,
            tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
            choices: formData.choices.filter(c => c.text.trim() !== '')
        };

        // Validate
        if (payload.choices.length < 2) {
            alert("Cần ít nhất 2 đáp án!"); setIsSubmitting(false); return;
        }
        if (!payload.choices.some(c => c.is_correct)) {
            alert("Cần chọn đáp án đúng!"); setIsSubmitting(false); return;
        }

        try {
            if (editingQuestion) {
                // --- TRƯỜNG HỢP SỬA (Endpoint 17) ---
                await teacherService.updateQuestion(editingQuestion.id, payload);

                // Cập nhật lại UI (thay thế câu hỏi cũ bằng dữ liệu mới)
                setQuestions(prev => prev.map(q => {
                    if (q.id === editingQuestion.id) {
                        return {
                            ...q,
                            ...payload,
                            // Map lại structure choice để hiển thị ngay không cần F5
                            question_choice: payload.choices.map((c, i) => ({
                                id: `updated-${i}`, order: c.order, text: c.text, is_correct: c.is_correct
                            }))
                        };
                    }
                    return q;
                }));
                alert("Cập nhật thành công!");
            } else {
                // --- TRƯỜNG HỢP TẠO MỚI (Endpoint 15) ---
                const res = await teacherService.createQuestion(payload);
                setQuestions([res.data.newQuestion, ...questions]);
                alert("Tạo mới thành công!");
            }
            resetForm();
        } catch (error) {
            alert("Có lỗi xảy ra!");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleViewDetail = async (id) => {
        try {
            const res = await teacherService.getQuestionDetail(id);
            // API trả về mảng [Obj], nên ta lấy phần tử đầu tiên
            const detail = res.data[0];
            setViewQuestion(detail);
        } catch (error) {
            alert("Không thể tải chi tiết câu hỏi.");
        }
    };

    return (
        <div className={styles.layout}>
            {/* Sidebar giữ nguyên */}
            <aside className={styles.sidebar}>
                <div className={styles.logo}>EduTest <span>GV</span></div>
                <nav className={styles.nav}>
                    <Link to="/teacher/dashboard">Tổng quan</Link>
                    <Link to="/teacher/classes">Quản lý Lớp học</Link>
                    <Link to="/teacher/questions" className={styles.active}>Ngân hàng câu hỏi</Link>
                    <Link to="/teacher/exams">Bài kiểm tra</Link>
                </nav>
                <div className={styles.sidebarFooter}><button onClick={logout}>Đăng xuất</button></div>
            </aside>

            {/* Main Content */}
            <div className={styles.mainContent}>
                <header className={styles.topHeader}>
                    <h3>Ngân hàng câu hỏi</h3>
                    <div className={styles.profile}>
                        <div style={{ textAlign: 'right' }}>
                            <span>Xin chào, <strong>{user?.name}</strong></span>
                        </div>
                        <div className={styles.avatar}>GV</div>
                    </div>
                </header>

                <div className={styles.contentBody}>
                    <div className={styles.pageHeader}>
                        <h2>Danh sách câu hỏi ({questions.length})</h2>
                        <button className={styles.createBtn} onClick={handleOpenCreate}>
                            + Tạo câu hỏi
                        </button>
                    </div>

                    {loading ? <p>Đang tải...</p> : (
                        <div className={styles.questionList}>
                            {questions.map((q, i) => (
                                <div key={q.id} className={styles.questionCard}>
                                    <div className={styles.qHeader}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span className={styles.qIndex}>Câu {i + 1}</span>
                                            <span className={`${styles.badge} ${styles[q.difficulty]}`}>{q.difficulty}</span>
                                        </div>

                                        {/* --- NÚT SỬA / XÓA --- */}
                                        <div className={styles.actionButtons}>
                                            <button
                                                className={styles.btnView}
                                                onClick={() => handleViewDetail(q.id)}
                                                title="Xem chi tiết"
                                            >
                                                Chi tiết
                                            </button>
                                            <button
                                                className={styles.btnEdit}
                                                onClick={() => handleEditClick(q)}
                                                title="Chỉnh sửa"
                                            >
                                                <i className="fa-solid fa-pen"></i>
                                            </button>
                                            <button
                                                className={styles.btnDelete}
                                                onClick={() => handleDeleteClick(q.id)}
                                                title="Xóa"
                                            >
                                                <i className="fa-solid fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>

                                    <p className={styles.qText}>{q.text}</p>
                                    <div className={styles.qTags}>
                                        {q.tags.map((t, idx) => <span key={idx}>#{t}</span>)}
                                    </div>
                                    <div className={styles.qFooter}>
                                        <span>Đáp án đúng: <strong>{q.question_choice.find(c => c.is_correct)?.text}</strong></span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODAL (DÙNG CHUNG CHO TẠO VÀ SỬA) --- */}
            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            {/* Đổi tiêu đề dựa theo chế độ */}
                            <h3>{editingQuestion ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}</h3>
                            <button onClick={resetForm}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.formScroll}>
                            {/* ... (Phần Form giữ nguyên như cũ) ... */}
                            <div className={styles.formGroup}>
                                <label>Nội dung câu hỏi *</label>
                                <textarea name="text" value={formData.text} onChange={handleInputChange} required rows="2" />
                            </div>

                            <div className={styles.row}>
                                <div className={styles.formGroup}>
                                    <label>Độ khó</label>
                                    <select name="difficulty" value={formData.difficulty} onChange={handleInputChange}>
                                        <option value="easy">Dễ (Easy)</option>
                                        <option value="medium">Trung bình (Medium)</option>
                                        <option value="hard">Khó (Hard)</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Tags (cách nhau bởi dấu phẩy)</label>
                                    <input type="text" name="tags" value={formData.tags} onChange={handleInputChange} placeholder="VD: math, dai-so" />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Các lựa chọn (Tích chọn đáp án đúng)</label>
                                {formData.choices.map((choice, index) => (
                                    <div key={index} className={styles.choiceRow}>
                                        <input
                                            type="radio"
                                            name="correct_answer"
                                            checked={choice.is_correct}
                                            onChange={() => handleCorrectSelect(index)}
                                        />
                                        <input
                                            type="text"
                                            placeholder={`Đáp án ${index + 1}`}
                                            value={choice.text}
                                            onChange={(e) => handleChoiceChange(index, e.target.value)}
                                            className={choice.is_correct ? styles.correctInput : ''}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className={styles.formGroup}>
                                <label>Giải thích (Optional)</label>
                                <textarea name="explanation" value={formData.explanation} onChange={handleInputChange} rows="2" />
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" className={styles.btnCancel} onClick={resetForm}>Hủy</button>
                                <button type="submit" className={styles.btnSubmit} disabled={isSubmitting}>
                                    {isSubmitting ? 'Đang lưu...' : (editingQuestion ? 'Cập nhật' : 'Tạo mới')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- NEW: MODAL XEM CHI TIẾT (Endpoint 19) --- */}
            {viewQuestion && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h3>Chi tiết câu hỏi</h3>
                            <button onClick={() => setViewQuestion(null)}>&times;</button>
                        </div>

                        <div className={styles.detailBody}>
                            <div className={styles.detailRow}>
                                <span className={styles.label}>Nội dung:</span>
                                <p className={styles.content}>{viewQuestion.text}</p>
                            </div>

                            <div className={styles.detailRow}>
                                <span className={styles.label}>Độ khó:</span>
                                <span className={`${styles.badge} ${styles[viewQuestion.difficulty]}`}>
                                    {viewQuestion.difficulty}
                                </span>
                            </div>

                            <div className={styles.detailRow}>
                                <span className={styles.label}>Tags:</span>
                                <div className={styles.qTags}>
                                    {viewQuestion.tags.map((t, i) => <span key={i}>#{t}</span>)}
                                </div>
                            </div>

                            <div className={styles.detailRow}>
                                <span className={styles.label}>Các lựa chọn:</span>
                                <ul className={styles.choiceList}>
                                    {viewQuestion.question_choice.map((c) => (
                                        <li key={c.id} className={c.is_correct ? styles.correct : ''}>
                                            <strong>{c.label || '•'}</strong> {c.text}
                                            {c.is_correct && <i className="fa-solid fa-check-circle" style={{ marginLeft: '10px' }}></i>}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className={styles.detailRow}>
                                <span className={styles.label}>Giải thích:</span>
                                <p className={styles.explanation}>
                                    {viewQuestion.explanation || "Không có giải thích."}
                                </p>
                            </div>
                        </div>

                        <div className={styles.modalActions}>
                            <button className={styles.btnCancel} onClick={() => setViewQuestion(null)}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherQuestionsPage;