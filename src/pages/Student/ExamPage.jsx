// src/pages/Student/ExamPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ExamPage.module.scss';

// Cau hoi Mau
const examQuestions = [
  {
    id: 'q1',
    text: 'Anime nào có nhân vật chính Gojo Satoru?',
    type: 'single',
    options: [
      { value: 'jujutsu', label: 'Jujutsu Kaisen' },
      { value: 'naruto', label: 'Naruto' },
      { value: 'onepiece', label: 'One Piece' },
    ],
  },
  {
    id: 'q2',
    text: 'Chọn hình lập phương tương ứng với hình khai triển.',
    type: 'single',
    hasDiagram: true,
    options: [
      { value: 'option1', label: '1, 2 and 3' },
      { value: 'option2', label: '1, 3 and 4' },
      { value: 'option3', label: '2 and 3' },
    ],
  },
  {
    id: 'q3',
    text: 'Phần mềm thiết kế giao diện phổ biến nhất?',
    type: 'single',
    options: [
      { value: 'figma', label: 'Figma' },
      { value: 'filmora', label: 'Filmora' },
      { value: 'audition', label: 'Adobe Audition' },
    ],
  },
  {
    id: 'q4',
    text: 'Ai là cầu thủ bóng đá đạt nhiều Quả bóng vàng nhất? (Chọn nhiều)',
    type: 'multiple',
    options: [
      { value: 'ronaldo', label: 'Cristiano Ronaldo' },
      { value: 'messi', label: 'Lionel Messi' },
      { value: 'zoro', label: 'Roronoa Zoro' },
    ],
  },
];

// Dap An mai
const correctAnswers = {
  q1: 'jujutsu',
  q2: 'option2',
  q3: 'figma',
  q4: ['ronaldo', 'messi'],
};

const MAX_TIME = 900;

// Trang mau bao gom co dong ho dem nguoc submit va tu dong navigate sang trang Result
export default function ExamPage() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(MAX_TIME);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState(() =>
    examQuestions.reduce((acc, q) => {
      acc[q.id] = q.type === 'multiple' ? [] : '';
      return acc;
    }, {})
  );

  const q = examQuestions[current];

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          submit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const submit = () => {
    let score = 0;
    const point = 10 / examQuestions.length;

    examQuestions.forEach((q) => {
      const a = answers[q.id];
      const c = correctAnswers[q.id];
      let ok = false;

      if (q.type === 'single') ok = a === c;
      if (q.type === 'multiple')
        ok = Array.isArray(a) && a.sort().join(',') === c.sort().join(',');

      if (ok) score += point;
    });

    const examId = 'mock_exam_1';
    const resultData = {
      examId,
      studentAnswers: answers,
      correctAnswers,
      score,
      maxScore: 10,
      timeTaken: MAX_TIME - timeLeft,
      examQuestions,
    };

    localStorage.setItem(`exam_result_${examId}`, JSON.stringify(resultData));
    navigate(`/student/result/${examId}`, { state: { resultData } });
  };

  const toggleAnswer = (value) => {
    if (q.type === 'single') {
      setAnswers({ ...answers, [q.id]: value });
    } else {
      const arr = answers[q.id];
      setAnswers({
        ...answers,
        [q.id]: arr.includes(value)
          ? arr.filter((v) => v !== value)
          : [...arr, value],
      });
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>EDUTEST – Exam</header>

      <div className={styles.layout}>
        <main className={styles.main}>
          <h2 className={styles.questionTitle}>
            Câu {current + 1}: {q.text}
          </h2>

          {q.hasDiagram && <div className={styles.diagram}>[ Diagram ]</div>}

          <div className={styles.options}>
            {q.options.map((o) => {
              const checked = q.type === 'multiple'
                ? answers[q.id].includes(o.value)
                : answers[q.id] === o.value;

              return (
                <label
                  key={o.value}
                  className={`${styles.option} ${checked ? styles.active : ''}`}
                >
                  <input
                    type={q.type === 'multiple' ? 'checkbox' : 'radio'}
                    checked={checked}
                    onChange={() => toggleAnswer(o.value)}
                  />
                  <span>{o.label}</span>
                </label>
              );
            })}
          </div>

          <div className={styles.navBtns}>
            <button disabled={current === 0} onClick={() => setCurrent(current - 1)}>
              ← Trước
            </button>
            {current === examQuestions.length - 1 ? (
              <button className={styles.submit} onClick={submit}>
                Nộp bài
              </button>
            ) : (
              <button onClick={() => setCurrent(current + 1)}>Tiếp →</button>
            )}
          </div>
        </main>

        <aside className={styles.sidebar}>
          <div className={styles.timer}>{formatTime(timeLeft)}</div>
          <div className={styles.grid}>
            {examQuestions.map((_, i) => (
              <button
                key={i}
                className={i === current ? styles.current : ''}
                onClick={() => setCurrent(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button className={styles.submitAlt} onClick={submit}>
            Nộp bài ngay
          </button>
        </aside>
      </div>
    </div>
  );
}
