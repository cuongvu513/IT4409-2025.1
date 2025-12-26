// src/pages/Teacher/ClassExamSessionPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import teacherService from '../../services/teacherService';
import styles from './ClassExamSessionPage.module.scss';

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

    //API 34
    const handleAddTime = async () => {
        try {
            setProcessing(true);

            await teacherService.addAccommodation(examInstanceId, {
            student_id: selectedStudent,
            extra_seconds: extraSeconds,
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
    const handleLockSession = async () => {
        if (!window.confirm('Bạn chắc chắn muốn khóa phiên thi?')) return;

        try {
            await teacherService.lockSession(examInstanceId, 'Khóa thủ công');
            alert('Đã khóa phiên thi');
        } catch (err) {
            alert(err.response?.data?.error || 'Không thể khóa');
        }
        };

        const handleUnlockSession = async () => {
        try {
            await teacherService.unlockSession(examInstanceId, 'Mở lại');
            alert('Đã mở khóa phiên thi');
        } catch (err) {
            alert(err.response?.data?.error || 'Không thể mở khóa');
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
            {/* HS đang thi */}
            <section className={styles.section}>
                <h3>👨‍🎓 Học sinh đang thi</h3>
                {activeStudents.length === 0 ? (
                <p>Không có học sinh nào đang thi</p>
                ) : (
                <ul>
                    {activeStudents.map((s) => (
                    <li key={s.id}>{s.name}</li>
                    ))}
                </ul>
                )}
            </section>

            {/* Tiến độ */}
            <section className={styles.section}>
                <h3>Tiến độ làm bài</h3>

                <p>Chưa bắt đầu: {progress.not_started.length}</p>
                <p>Đang làm: {progress.in_progress.length}</p>
                <p>Đã nộp: {progress.finished.length}</p>
            </section>

            {/* Vi phạm */}
            <section className={styles.section}>
                <h3>Vi phạm</h3>
                {flags.length === 0 ? (
                <p>Chưa có vi phạm</p>
                ) : (
                <table>
                    <thead>
                    <tr>
                        <th>Học sinh</th>
                        <th>Loại</th>
                        <th>Thời gian</th>
                    </tr>
                    </thead>
                    <tbody>
                    {flags.map((f) => (
                        <tr key={f.id}>
                        <td>{f.student.name}</td>
                        <td>{f.flag_type}</td>
                        <td>{new Date(f.created_at).toLocaleString()}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                )}
            </section>
            
            {/* Cong gio */}
            <section className={styles.section}>
            <h3>⏱ Cộng thêm thời gian làm bài</h3>

            {activeStudents.length === 0 ? (
                <p className={styles.emptyText}>
                ⚠️ Hiện không có học sinh nào đang thi
                </p>
            ) : (
                <>
                <div className={styles.formGroup}>
                    <label>Học sinh đang thi</label>
                    <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    >
                    <option value="">-- Chọn học sinh --</option>
                    {activeStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                        {s.name}
                        </option>
                    ))}
                    </select>
                </div>

                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                    <label>Số giây cộng thêm</label>
                    <input
                        type="number"
                        min={60}
                        step={60}
                        value={extraSeconds}
                        onChange={(e) => setExtraSeconds(Number(e.target.value))}
                        placeholder="VD: 300 = 5 phút"
                    />
                    </div>

                    <div className={styles.formGroup}>
                    <label>Ghi chú</label>
                    <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Lý do cộng thêm thời gian"
                    />
                    </div>
                </div>

                <button
                    disabled={processing || !selectedStudent || extraSeconds <= 0}
                    onClick={handleAddTime}
                >
                    {processing ? '⏳ Đang xử lý...' : '➕ Cộng thêm thời gian'}
                </button>
                </>
            )}
            </section>
            
            {/* Khoa + mo khoa phien ti */}
            <section className={styles.section}>
                <h3>🔐 Điều khiển phiên thi</h3>

                <div className={styles.controlBox}>
                    <p className={styles.controlDesc}>
                    Giáo viên có thể khóa hoặc mở khóa phiên thi của học sinh khi phát hiện vi phạm.
                    </p>

                    <div className={styles.controlActions}>
                    <button
                        className={styles.lockBtn}
                        onClick={() => handleLockSession()}
                        disabled={processing}
                    >
                        🔒 Khóa phiên thi
                    </button>

                    <button
                        className={styles.unlockBtn}
                        onClick={() => handleUnlockSession()}
                        disabled={processing}
                    >
                        🔓 Mở khóa phiên thi
                    </button>
                    </div>
                </div>
            </section>

            </>
        )}
        </div>
    );
};

export default ClassExamSessionPage;
