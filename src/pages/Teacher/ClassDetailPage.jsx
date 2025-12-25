// src/pages/Teacher/ClassDetailPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import teacherService from '../../services/teacherService';
import styles from './ClassDetailPage.module.scss';

const ClassDetailPage = () => {
    const { id } = useParams();

    // KHÔNG CẦN AuthContext hay TopHeader ở đây nữa vì TeacherLayout đã lo

    // --- State Dữ liệu ---
    const [classData, setClassData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // --- State Thông báo (Requests) ---
    const [requests, setRequests] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef(null);

    // 1. Load chi tiết lớp
    const fetchClassData = async () => {
        try {
            const res = await teacherService.getClassDetail(id);
            setClassData(res.data);
        } catch (err) {
            setError('Lỗi tải lớp học');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClassData();
    }, [id]);

    // 2. Load yêu cầu tham gia
    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const res = await teacherService.getEnrollmentRequests(id);
                setRequests(res.data);
            } catch (err) {
                console.error("Lỗi tải yêu cầu:", err);
            }
        };
        fetchRequests();
    }, [id]);

    // 3. Click outside để đóng dropdown chuông
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 4. Xử lý Duyệt/Từ chối
    const handleProcessRequest = async (requestId, status) => {
        try {
            const res = await teacherService.respondToEnrollment(requestId, status);
            alert(res.data.message);

            // Xóa khỏi danh sách chờ
            setRequests(prev => prev.filter(req => req.id !== requestId));

            // Nếu duyệt -> Load lại lớp để thấy sinh viên mới
            if (status === 'approved') {
                fetchClassData();
            }
        } catch (error) {
            alert(error.response?.data?.error || "Xử lý thất bại");
        }
    };

    if (loading) return <div style={{ padding: '30px', textAlign: 'center' }}>Đang tải dữ liệu...</div>;
    if (error) return <div style={{ padding: '30px', textAlign: 'center', color: 'red' }}>{error} <Link to="/teacher/classes">Quay lại</Link></div>;
    if (!classData) return null;

    const { classInfo, listStudent } = classData;

    return (
        // XÓA: .layout, .sidebar, .mainContent, <TopHeader>
        // CHỈ GIỮ LẠI PHẦN NỘI DUNG CONTENT BODY
        <div className={styles.contentBody}>
            <div className={styles.backLink}>
                <Link to="/teacher/classes"><i className="fa-solid fa-arrow-left"></i> Quay lại danh sách</Link>
            </div>

            {/* CARD THÔNG TIN LỚP */}
            <div className={styles.infoCard}>
                <div className={styles.infoHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <h2>{classInfo.name}</h2>
                        <span className={styles.codeTag}>{classInfo.code}</span>
                    </div>

                    {/* --- CHUÔNG THÔNG BÁO --- */}
                    <div className={styles.notificationWrapper} ref={notificationRef}>
                        <div
                            className={styles.bellIcon}
                            onClick={() => setShowNotifications(!showNotifications)}
                            title="Yêu cầu tham gia"
                        >
                            <i className="fa-solid fa-bell"></i>
                            {requests.length > 0 && (
                                <span className={styles.badge}>{requests.length}</span>
                            )}
                        </div>

                        {/* DROPDOWN DANH SÁCH CHỜ */}
                        {showNotifications && (
                            <div className={styles.dropdown}>
                                <div className={styles.dropdownHeader}>
                                    <h4>Yêu cầu tham gia ({requests.length})</h4>
                                </div>
                                <div className={styles.dropdownBody}>
                                    {requests.length === 0 ? (
                                        <p className={styles.emptyNoti}>Không có yêu cầu nào.</p>
                                    ) : (
                                        requests.map(req => (
                                            <div key={req.id} className={styles.requestItem}>
                                                <div className={styles.reqInfo}>
                                                    <strong style={{ wordBreak: 'break-all' }}>
                                                        Student-ID: {req.student_id}
                                                    </strong>
                                                    {req.note && <p className={styles.reqNote}>"{req.note}"</p>}
                                                    <span className={styles.reqTime}>
                                                        {new Date(req.requested_at).toLocaleDateString('vi-VN')}
                                                    </span>
                                                </div>
                                                <div className={styles.reqActions}>
                                                    <button
                                                        className={styles.btnApprove}
                                                        title="Duyệt"
                                                        onClick={() => handleProcessRequest(req.id, 'approved')}
                                                    >
                                                        <i className="fa-solid fa-check"></i>
                                                    </button>
                                                    <button
                                                        className={styles.btnReject}
                                                        title="Từ chối"
                                                        onClick={() => handleProcessRequest(req.id, 'rejected')}
                                                    >
                                                        <i className="fa-solid fa-xmark"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <p className={styles.description}>{classInfo.description}</p>
                <div className={styles.metaInfo}>
                    <span>Ngày tạo: {new Date(classInfo.created_at).toLocaleDateString('vi-VN')}</span>
                    <span>Sĩ số: <strong>{listStudent.length}</strong> học viên</span>
                </div>
            </div>

            {/* DANH SÁCH SINH VIÊN (APPROVED) */}
            <div className={styles.studentSection}>
                <h3>Danh sách sinh viên chính thức</h3>
                {listStudent.length > 0 ? (
                    <table className={styles.studentTable}>
                        <thead>
                            <tr>
                                <th>STT</th>
                                <th>Họ tên</th>
                                <th>Email</th>
                                <th>Trạng thái</th>
                                <th>Ngày tham gia</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listStudent.map((item, index) => (
                                <tr key={item.id}>
                                    <td>{index + 1}</td>
                                    <td style={{ fontWeight: 'bold' }}>{item.studentInfo.name}</td>
                                    <td>{item.studentInfo.email}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${styles[item.status]}`}>
                                            {item.status === 'approved' ? 'Đã duyệt' : item.status}
                                        </span>
                                    </td>
                                    <td>{new Date(item.requested_at).toLocaleDateString('vi-VN')}</td>
                                    <td>
                                        <button className={styles.removeBtn}>Xóa</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className={styles.emptyText}>Chưa có sinh viên nào trong lớp này.</p>
                )}
            </div>
        </div>
    );
};

export default ClassDetailPage;