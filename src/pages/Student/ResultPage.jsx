import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import styles from './ResultPage.module.scss';

//Demo Hien thi ket qua
const ResultPage = () => {
    const { examId } = useParams();
    const location = useLocation();
    const [result, setResult] = useState(null);

    useEffect(() => {
        let data = location.state?.resultData;
        if (!data) {
            const stored = localStorage.getItem(`exam_result_${examId}`);
            if (stored) data = JSON.parse(stored);
        }
        if (data) setResult(data);
    }, [examId, location.state]);

    if (!result) {
        return <div className={styles.loading}>Đang tải kết quả...</div>;
    }

    const formatTime = (s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const { score, maxScore, timeTaken, studentAnswers, correctAnswers } = result;
    const finalScore = ((score / maxScore) * 10).toFixed(1);

    const detailedQuestions = {
        q1: { text: "Anime nào có nhân vật chính Gojo Satoru?", correct: correctAnswers.q1 },
        q2: { text: "Phản ứng hóa học nào tạo ra nước?", correct: correctAnswers.q2 },
        q3: { text: "Phần mềm thiết kế giao diện phổ biến nhất?", correct: correctAnswers.q3 },
        q4: { text: "Ai là cầu thủ bóng đá đạt nhiều Quả bóng vàng nhất?", correct: correctAnswers.q4 },
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>📋 Kết quả bài thi</h1>

            {/* SCORE BOX */}
            <div className={styles.scoreBox}>
                <div className={styles.scoreHeader}>
                    <h2>Điểm số</h2>
                    <span
                        className={`${styles.finalScore} ${
                            finalScore >= 5 ? styles.pass : styles.fail
                        }`}
                    >
                        {finalScore}/10
                    </span>
                </div>

                <div className={styles.stats}>
                    <div>
                        <strong>{score}/{maxScore}</strong>
                        <p>Câu đúng</p>
                    </div>
                    <div>
                        <strong>{formatTime(timeTaken)}</strong>
                        <p>Thời gian</p>
                    </div>
                </div>
            </div>

            {/* DETAILS */}
            <h2 className={styles.subTitle}>Chi tiết từng câu hỏi</h2>

            <div className={styles.detailList}>
                {Object.keys(detailedQuestions).map((key, index) => {
                    const q = detailedQuestions[key];
                    const student = studentAnswers[key];
                    const correct = q.correct;

                    const isCorrect = Array.isArray(correct)
                        ? JSON.stringify(student?.sort()) === JSON.stringify(correct.sort())
                        : student === correct;

                    return (
                        <div
                            key={key}
                            className={`${styles.questionItem} ${
                                isCorrect
                                    ? styles.correct
                                    : student
                                    ? styles.wrong
                                    : styles.empty
                            }`}
                        >
                            <div className={styles.questionHeader}>
                                <p>
                                    Câu {index + 1}: {q.text}
                                </p>
                                <span>
                                    {isCorrect
                                        ? 'Đúng'
                                        : student
                                        ? 'Sai'
                                        : 'Chưa làm'}
                                </span>
                            </div>

                            <p>
                                <strong>Đáp án của bạn:</strong>{' '}
                                {student || 'Chưa trả lời'}
                            </p>

                            {!isCorrect && (
                                <p>
                                    <strong>Đáp án đúng:</strong> {correct}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ResultPage;
