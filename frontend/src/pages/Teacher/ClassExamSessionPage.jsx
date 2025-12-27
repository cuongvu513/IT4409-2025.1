// src/pages/Teacher/ClassExamSessionPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import teacherService from '../../services/teacherService';
import styles from './ClassExamSessionPage.module.scss';
import ProgressCircle from '../../components/ProgressCircle';

const ClassExamSessionPage = () => {
    const { classId, examInstanceId } = useParams();
    const navigate = useNavigate();

    const [activeStudents, setActiveStudents] = useState([]);
    const [progress, setProgress] = useState(null);
    const [flags, setFlags] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            const [studentsRes, progressRes, flagsRes] = await Promise.all([
            teacherService.getActiveStudents(classId),
            teacherService.getExamProgress(classId, examInstanceId),
            teacherService.getClassFlags(classId),
            ]);

            setActiveStudents(studentsRes.data);
            setProgress(progressRes.data);
            setFlags(flagsRes.data);
        } catch (err) {
            console.error(err);

            const status = err.response?.status;

            if (status === 403 || status === 404 || status === 500) {
            alert('Không thể truy cập phiên thi này. Bạn sẽ được quay lại.');
            navigate(`/teacher/classes/${classId}/exams`);
            } else {
            alert('Lỗi không xác định');
            }
        } finally {
            setLoading(false);
        }
    };

    const [selectedStudent, setSelectedStudent] = useState('');
    const [extraSeconds, setExtraSeconds] = useState(300);
    const [note, setNote] = useState('');
    const [processing, setProcessing] = useState(false);
    const [selectedSession, setSelectedSession] = useState('');

    // derive unique active sessions from flags (flags include session_id)
    const sessionOptions = Array.from(
        flags.reduce((m, f) => {
            if (!m.has(f.session_id)) {
                m.set(f.session_id, {
                    sessionId: f.session_id,
                    name: f.student?.name || `Phiên ${f.session_id}`,
                    flagType: f.flag_type,
                    time: f.created_at,
                });
            }
            return m;
        }, new Map()).values()
    );

    //API 34
    const handleAddTime = async () => {
        try {
            setProcessing(true);

            await teacherService.addAccommodation(examInstanceId, {
            student_id: selectedStudent,
            add_seconds: extraSeconds,
            notes: note,
            });

            alert('Cộng giờ thành công');
            setNote('');
        } catch (err) {
            alert(err.response?.data?.error || 'Không thể cộng giờ');
        } finally {
            setProcessing(false);
        }
    };

    //API 36+37
    const handleLockSession = async (sessionId) => {
        if (!window.confirm('Bạn chắc chắn muốn khóa phiên thi?')) return;

        try {
            setProcessing(true);
            await teacherService.lockSession(sessionId, 'Khóa thủ công');
            alert('Đã khóa phiên thi');
            await fetchAll();
        } catch (err) {
            alert(err.response?.data?.error || 'Không thể khóa');
        } finally {
            setProcessing(false);
        }
    };

    const handleUnlockSession = async (sessionId) => {
        if (!window.confirm('Bạn chắc chắn muốn mở khóa phiên thi?')) return;

        try {
            setProcessing(true);
            await teacherService.unlockSession(sessionId, 'Mở lại');
            alert('Đã mở khóa phiên thi');
            await fetchAll();
        } catch (err) {
            alert(err.response?.data?.error || 'Không thể mở khóa');
        } finally {
            setProcessing(false);
        }
    };



    return (
        <div className={styles.contentBody}>
        <div className={styles.header}>
            <h2>Quản lý phiên thi</h2>
            <button onClick={() => navigate(-1)}>← Quay lại</button>
        </div>

        {loading ? (
            <p>Đang tải dữ liệu...</p>
        ) : (
            <>
            <section className={styles.section}>
                <h3>📊 Tiến độ làm bài</h3>

                <div className={styles.circleGrid}>
                    <ProgressCircle
                    title="Chưa bắt đầu"
                    value={progress.not_started.length}
                    total={activeStudents.length}
                    color="#9ca3af"
                    />
                    <ProgressCircle
                    title="Đang làm"
                    value={progress.in_progress.length}
                    total={activeStudents.length}
                    color="#f59e0b"
                    />
                    <ProgressCircle
                    title="Đã nộp"
                    value={progress.finished.length}
                    total={activeStudents.length}
                    color="#10b981"
                    />
                </div>
            </section>

            <section className={styles.section}>
                <h3>👨‍🎓 Học sinh đang thi</h3>

                {activeStudents.length === 0 ? (
                    <p>Không có học sinh nào đang thi</p>
                ) : (
                    <div className={styles.studentList}>
                    {activeStudents.map((s) => {
                        const session = sessionOptions.find(
                        (x) => x.name === s.name
                        );

                        return (
                        <div key={s.id} className={styles.studentCard}>
                            <div className={styles.studentInfo}>
                            <strong>{s.name}</strong>
                            <span>Session: {session?.sessionId || '—'}</span>
                            </div>

                            <div className={styles.studentActions}>
                            <button
                                onClick={() => {
                                setSelectedStudent(s.id);
                                setExtraSeconds(300);
                                }}
                            >
                                ➕ Cộng giờ
                            </button>

                            {session && (
                                <>
                                <button
                                    className={styles.lockBtn}
                                    onClick={() =>
                                    handleLockSession(session.sessionId)
                                    }
                                >
                                    🔒 Khóa
                                </button>
                                </>
                            )}

                            {selectedStudent && (
                                <section className={styles.section}>
                                    <h3>⏱ Cộng thêm thời gian</h3>

                                    <div className={styles.formRow}>
                                    <input
                                        type="number"
                                        min={60}
                                        step={60}
                                        value={extraSeconds}
                                        onChange={(e) => setExtraSeconds(Number(e.target.value))}
                                    />

                                    <input
                                        type="text"
                                        placeholder="Ghi chú"
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                    />

                                    <button onClick={handleAddTime} disabled={processing}>
                                        {processing ? '⏳' : '✔ Xác nhận'}
                                    </button>

                                    <button
                                        className={styles.cancelBtn}
                                        onClick={() => setSelectedStudent('')}
                                    >
                                        ✖ Hủy
                                    </button>
                                    </div>
                            </section>
                                )}
                            </div>
                        </div>
                        );
                    })}
                    </div>
                )}
            </section>
            <section className={styles.section}>
                <h3>🚩 Phiên thi có dấu hiệu bất thường</h3>
                {flags.length > 0 && (
                <section className={styles.section}>
                    <h3>🚨 Vi phạm</h3>

                    <table>
                    <thead>
                        <tr>
                        <th>Học sinh</th>
                        <th>Loại</th>
                        <th>Thời gian</th>
                        <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {flags.map((f) => (
                        <tr key={f.id}>
                            <td>{f.student?.name}</td>
                            <td>{f.flag_type}</td>
                            <td>{new Date(f.created_at).toLocaleString()}</td>
                            <td>
                            <button
                                onClick={() => handleUnlockSession(f.session_id)}
                                disabled={processing}
                            >
                                🔓 Mở khóa
                            </button>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </section>
                )}
                {flags.length === 0 && <p>Không có phiên thi nào bị đánh dấu.</p>}
            </section>
            </>
        )}
        </div>
    );
};

export default ClassExamSessionPage;
