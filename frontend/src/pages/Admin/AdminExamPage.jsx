// src/pages/Admin/AdminExamPage.jsx
import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import styles from './AdminExamPage.module.scss'; // Tạo file css ở bước 4
import { useNavigate } from 'react-router-dom';

const AdminExamPage = () => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const navigate = useNavigate();


    // Filter State
    const [filters, setFilters] = useState({
        search: '',
        status: '', // upcoming, ongoing, ended, suspended
        page: 1,
        limit: 10
    });

    // Load Data
    useEffect(() => {
        const fetchExams = async () => {
            setLoading(true);
            try {
                const params = { ...filters };
                if (!params.search) delete params.search;
                if (!params.status) delete params.status;

                const res = await adminService.getExams(params);
                setExams(res.data.exams);
                setPagination(res.data.pagination);
            } catch (error) {
                console.error("Lỗi tải kỳ thi:", error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(() => { fetchExams(); }, 500);
        return () => clearTimeout(timeoutId);
    }, [filters]);

    // Handlers
    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value, page: 1 }));
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setFilters(prev => ({ ...prev, page: newPage }));
        }
    };

    // Helpers
    const formatDate = (str) => new Date(str).toLocaleString('vi-VN');
    const formatDuration = (sec) => `${Math.floor(sec / 60)} phút`;

    const getStatusLabel = (status) => {
        switch (status) {
            case 'ongoing': return <span className={`${styles.badge} ${styles.ongoing}`}>Đang diễn ra</span>;
            case 'upcoming': return <span className={`${styles.badge} ${styles.upcoming}`}>Sắp tới</span>;
            case 'ended': return <span className={`${styles.badge} ${styles.ended}`}>Đã kết thúc</span>;
            case 'suspended': return <span className={`${styles.badge} ${styles.suspended}`}>Tạm dừng</span>;
            default: return <span className={styles.badge}>{status}</span>;
        }
    };

    return (
        <div className={styles.container}>
            <h2>Quản lý Kỳ thi</h2>

            <div className={styles.contentSection}>
                {/* TOOLBAR */}
                <div className={styles.toolbar}>
                    <div className={styles.searchBox}>
                        <i className="fa-solid fa-search"></i>
                        <input
                            name="search"
                            placeholder="Tìm kiếm tên đề thi..."
                            value={filters.search}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <select name="status" value={filters.status} onChange={handleFilterChange} className={styles.select}>
                        <option value="">-- Tất cả trạng thái --</option>
                        <option value="ongoing">Đang diễn ra</option>
                        <option value="upcoming">Sắp tới</option>
                        <option value="ended">Đã kết thúc</option>
                        <option value="suspended">Tạm dừng</option>
                    </select>
                    <div className={styles.totalLabel}>Tổng: <strong>{pagination.total}</strong> kỳ thi</div>
                </div>

                {/* TABLE */}
                {loading ? <p className={styles.loading}>Đang tải dữ liệu...</p> : (
                    <>
                        <div className={styles.tableContainer}>
                            <table className={styles.dataTable}>
                                <thead>
                                    <tr>
                                        <th>STT</th>
                                        <th>Tên kỳ thi</th>
                                        <th>Lớp / Giáo viên</th>
                                        <th>Thời gian</th>
                                        <th>Trạng thái</th>
                                        <th>Tiến độ</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {exams.length > 0 ? exams.map((exam, index) => (
                                        <tr key={exam.id}>
                                            <td>{(filters.page - 1) * filters.limit + index + 1}</td>
                                            <td>
                                                <strong className={styles.examTitle}>{exam.title}</strong>
                                                <small className={styles.duration}>
                                                    <i className="fa-regular fa-clock"></i> {formatDuration(exam.duration_seconds)}
                                                </small>
                                            </td>
                                            <td>
                                                <div className={styles.classInfo}>
                                                    <span>{exam.class?.name}</span>
                                                    <small>{exam.teacher?.name}</small>
                                                </div>
                                            </td>
                                            <td>
                                                <div className={styles.timeInfo}>
                                                    <span className={styles.start}>BĐ: {formatDate(exam.starts_at)}</span>
                                                    <span className={styles.end}>KT: {formatDate(exam.ends_at)}</span>
                                                </div>
                                            </td>
                                            <td>{getStatusLabel(exam.status)}</td>
                                            <td>
                                                <div className={styles.progress}>
                                                    <strong>{exam.submitted_sessions}</strong> / {exam.total_sessions}
                                                    <div className={styles.progressBar}>
                                                        <div
                                                            style={{ width: `${(exam.submitted_sessions / Math.max(exam.total_sessions, 1)) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <button
                                                    className={styles.btnAction}
                                                    title="Xem chi tiết"
                                                    onClick={() => navigate(`/admin/exams/${exam.id}`)}
                                                >
                                                    <i className="fa-solid fa-eye"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="7" align="center">Không tìm thấy kỳ thi nào.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* PAGINATION */}
                        <div className={styles.pagination}>
                            <button
                                disabled={filters.page === 1}
                                onClick={() => handlePageChange(filters.page - 1)}
                            >
                                <i className="fa-solid fa-angle-left"></i>
                            </button>
                            <span>Trang {filters.page} / {pagination.totalPages}</span>
                            <button
                                disabled={filters.page === pagination.totalPages}
                                onClick={() => handlePageChange(filters.page + 1)}
                            >
                                <i className="fa-solid fa-angle-right"></i>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminExamPage;