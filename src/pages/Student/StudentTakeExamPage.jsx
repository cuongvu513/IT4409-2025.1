import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import studentService from '../../services/studentService';
import styles from './StudentTakeExamPage.module.scss';

const StudentTakeExamPage = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // --- XÁC ĐỊNH ĐƯỜNG DẪN QUAY VỀ ---
    // Mặc định về /student/classes nếu không có state
    const backPath = location.state?.from || '/student/classes';

    // --- STATE DỮ LIỆU ---
    const [sessionData, setSessionData] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [userAnswers, setUserAnswers] = useState({});

    // --- STATE UI ---
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- STATE KẾT QUẢ ---
    const [reviewMode, setReviewMode] = useState(false);
    const [examResult, setExamResult] = useState(null);

    // Refs
    const timerRef = useRef(null);
    const heartbeatRef = useRef(null);
    const isInitRef = useRef(false);

    // --- 1. KHỞI TẠO BÀI THI ---
    useEffect(() => {
        if (isInitRef.current) return;
        isInitRef.current = true;

        const initExam = async () => {
            try {
                const storedSession = JSON.parse(localStorage.getItem(`exam_session_${examId}`));
                let currentSession = null;

                // A. RESUME (Dùng lại phiên cũ)
                if (storedSession && new Date(storedSession.ends_at) > new Date()) {
                    console.log("Khôi phục phiên thi cũ...");
                    currentSession = storedSession;
                }
                // B. START NEW (Gọi API tạo mới)
                else {
                    const res = await studentService.startExam(examId);
                    const data = res.data;
                    currentSession = {
                        session_id: data.session_id,
                        token: data.token,
                        ends_at: data.ends_at
                    };
                    localStorage.setItem(`exam_session_${examId}`, JSON.stringify(currentSession));
                }

                // Cập nhật Session Data (Timer sẽ tự chạy nhờ useEffect số 2)
                setSessionData(currentSession);

                // C. LẤY CÂU HỎI
                const questionsRes = await studentService.getExamSessionQuestions(
                    currentSession.session_id,
                    currentSession.token
                );
                const listQuestions = questionsRes.data || [];
                setQuestions(listQuestions);

                // Khôi phục đáp án đã chọn
                const savedAnswers = {};
                listQuestions.forEach(q => {
                    if (q.selected_choice_ids?.length > 0) {
                        savedAnswers[q.id] = q.selected_choice_ids;
                    }
                });
                setUserAnswers(savedAnswers);
                setLoading(false);

            } catch (error) {
                console.error("Lỗi khởi tạo:", error);
                alert("Bạn đã hoàn thành bài thi !");
                navigate(backPath);
            }
        };

        initExam();

        // Không cleanup timer ở đây để tránh lỗi F5 mất timer
    }, [examId]);


    // --- 2. LOGIC ĐỒNG HỒ (CHẠY KHI CÓ SESSION) ---
    useEffect(() => {
        if (!sessionData || reviewMode) return;

        const endTime = new Date(sessionData.ends_at).getTime();

        const updateTimer = () => {
            const now = new Date().getTime();
            const distance = endTime - now;

            if (distance < 0) {
                setTimeLeft(0);
                clearInterval(timerRef.current);
                // handleAutoSubmit(); // Tự nộp nếu cần
            } else {
                setTimeLeft(Math.floor(distance / 1000));
            }
        };

        updateTimer(); // Chạy ngay lập tức
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(updateTimer, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [sessionData, reviewMode]);


    // --- 3. HEARTBEAT & ANTI-CHEAT ---
    useEffect(() => {
        if (!sessionData || reviewMode) return;

        const handleHeartbeatResponse = (res) => {
            // Kiểm tra nếu Backend báo locked
            if (res.data && res.data.locked) {
                alert("Bạn đã vi phạm quy chế thi quá số lần cho phép. Bài thi đã bị khóa!");
                // Tự động nộp bài hoặc đá ra ngoài
                navigate(backPath);
                // Hoặc gọi hàm handleSubmitExam() để nộp cưỡng ép
            }
        };

        // 1. Heartbeat định kỳ (Mỗi 30s)
        heartbeatRef.current = setInterval(() => {
            studentService.sendHeartbeat(sessionData.session_id, sessionData.token, false)
                .then(handleHeartbeatResponse)
                .catch(err => console.error("Heartbeat error", err));
        }, 30000);

        // 2. Bắt sự kiện rời tab (Focus lost)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                console.warn("Cảnh báo: Phát hiện rời tab!");
                studentService.sendHeartbeat(sessionData.session_id, sessionData.token, true)
                    .then(handleHeartbeatResponse) // <-- Xử lý nếu bị khóa ngay lập tức
                    .catch(err => console.error("Focus lost error", err));
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            clearInterval(heartbeatRef.current);
        };
    }, [sessionData, reviewMode, navigate]); // Thêm navigate vào dependency


    // --- 4. CHỌN ĐÁP ÁN (HỖ TRỢ MULTICHOICE) ---
    const handleSelectAnswer = async (questionId, choiceId, isMultiple) => {
        if (reviewMode) return;

        let newChoices = [];
        const currentChoices = userAnswers[questionId] || [];

        if (isMultiple) {
            // Logic Checkbox: Toggle
            if (currentChoices.includes(choiceId)) {
                newChoices = currentChoices.filter(id => id !== choiceId);
            } else {
                newChoices = [...currentChoices, choiceId];
            }
        } else {
            // Logic Radio: Chọn 1
            newChoices = [choiceId];
        }

        // Update UI
        setUserAnswers(prev => ({ ...prev, [questionId]: newChoices }));

        // Gọi API lưu
        try {
            await studentService.submitAnswer(
                sessionData.session_id,
                sessionData.token,
                questionId,
                newChoices
            );
        } catch (error) { console.error("Lỗi lưu đáp án"); }
    };

    // --- 5. NỘP BÀI ---
    const handleSubmitExam = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn nộp bài?")) return;
        setIsSubmitting(true);
        try {
            const res = await studentService.finishExam(sessionData.session_id, sessionData.token);
            const result = res.data;

            clearInterval(timerRef.current);
            clearInterval(heartbeatRef.current);
            localStorage.removeItem(`exam_session_${examId}`);

            setExamResult(result);
            setReviewMode(true);
            setIsSubmitting(false);

            alert(`Nộp bài thành công!\nĐiểm số: ${result.score}/${result.max_score}`);
        } catch (error) {
            alert("Nộp bài thất bại. Vui lòng thử lại!");
            setIsSubmitting(false);
        }
    };

    // --- HELPER UI ---
    const formatTime = (seconds) => {
        if (seconds === null || seconds < 0) return "--:--";
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const getQuestionStatus = (qId) => {
        if (!examResult?.details) return null;
        const detail = examResult.details.find(d => d.question_id === qId);
        return detail ? detail.correct : null;
    };

    const getChoiceStyle = (qId, choiceId) => {
        if (!reviewMode) return {};
        const isSelected = userAnswers[qId]?.includes(choiceId);
        if (examResult?.details) {
            const isCorrectQuestion = getQuestionStatus(qId);
            if (isSelected) return isCorrectQuestion ? styles.correctChoice : styles.wrongChoice;
        }
        return {};
    };

    if (loading) return <div className={styles.loadingScreen}>Đang tải đề thi...</div>;

    return (
        <div className={styles.examContainer}>
            <div className={styles.leftPanel}>
                {reviewMode ? (
                    <div className={`${styles.timerCard} ${styles.resultCard}`}>
                        <h3>KẾT QUẢ</h3>
                        <div className={styles.score}>{examResult?.score} <span className={styles.maxScore}>/ {examResult?.max_score}</span></div>
                        <p style={{ marginBottom: 0 }}>Điểm số</p>
                        {!examResult?.details && (
                            <div className={styles.hiddenNotice}><i className="fa-solid fa-lock"></i> Chi tiết đáp án đang ẩn</div>
                        )}
                    </div>
                ) : (
                    <div className={styles.timerCard}>
                        <h3>Thời gian còn lại</h3>
                        <div className={styles.timer}>{formatTime(timeLeft)}</div>
                    </div>
                )}

                <div className={styles.questionPalette}>
                    <p>Câu hỏi ({questions?.length || 0})</p>
                    <div className={styles.grid}>
                        {questions?.map((q, index) => {
                            const isAnswered = userAnswers[q.id] && userAnswers[q.id].length > 0;
                            let badgeClass = '';
                            if (reviewMode && examResult?.details) {
                                const isCorrect = getQuestionStatus(q.id);
                                badgeClass = isCorrect ? styles.correctBadge : styles.wrongBadge;
                            } else if (isAnswered) {
                                badgeClass = styles.answered;
                            }
                            return (
                                <a key={q.id} href={`#q-${q.id}`} className={`${styles.qBadge} ${badgeClass}`}>
                                    {index + 1}
                                </a>
                            );
                        })}
                    </div>
                </div>

                {!reviewMode ? (
                    <button className={styles.submitBtn} onClick={handleSubmitExam} disabled={isSubmitting}>
                        {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
                    </button>
                ) : (
                    // --- NÚT QUAY LẠI THÔNG MINH ---
                    <button
                        className={styles.exitBtn}
                        onClick={() => navigate(backPath)}
                    >
                        <i className="fa-solid fa-arrow-left"></i> Quay lại danh sách
                    </button>
                )}
            </div>

            <div className={styles.rightPanel}>
                <div className={styles.paper}>
                    {questions?.length === 0 && <p className={styles.empty}>Không có câu hỏi nào.</p>}

                    {questions?.map((q, index) => {
                        let statusText = null;
                        let statusClass = '';
                        if (reviewMode && examResult?.details) {
                            const isCorrect = getQuestionStatus(q.id);
                            statusText = isCorrect ? "ĐÚNG" : "SAI";
                            statusClass = isCorrect ? styles.textSuccess : styles.textDanger;
                        }

                        return (
                            <div key={q.id} id={`q-${q.id}`} className={styles.questionBlock}>
                                <div className={styles.qTitle}>
                                    <span className={styles.qIndex}>Câu {index + 1}:</span>
                                    <span>{q.text}</span>
                                    {/* Hiển thị loại câu hỏi */}
                                    <span className={styles.qType}>{q.multichoice ? "(Nhiều đáp án)" : "(Một đáp án)"}</span>
                                    <span className={styles.points}>({q.points} điểm)</span>
                                    {statusText && <span className={`${styles.resultLabel} ${statusClass}`}>{statusText}</span>}
                                </div>

                                <div className={styles.choices}>
                                    {q.choices?.map((choice) => {
                                        const isSelected = userAnswers[q.id]?.includes(choice.id);
                                        const reviewClass = getChoiceStyle(q.id, choice.id);

                                        return (
                                            <div
                                                key={choice.id}
                                                className={`
                                                    ${styles.choiceItem} 
                                                    ${isSelected ? styles.selected : ''} 
                                                    ${reviewClass}
                                                `}
                                                // --- XỬ LÝ CLICK DỰA VÀO LOẠI CÂU HỎI ---
                                                onClick={() => handleSelectAnswer(q.id, choice.id, q.multichoice)}
                                                style={{ pointerEvents: reviewMode ? 'none' : 'auto' }}
                                            >
                                                {/* --- HIỂN THỊ ICON VUÔNG / TRÒN --- */}
                                                <div className={`${styles.iconCheck} ${q.multichoice ? styles.square : styles.circle}`}>
                                                    {isSelected && <div className={styles.innerDot}></div>}
                                                </div>

                                                <span className={styles.choiceLabel}>{choice.label}</span>
                                                <span className={styles.choiceText}>{choice.text}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default StudentTakeExamPage;