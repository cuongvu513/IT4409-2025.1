// src/pages/Admin/AdminClassPage.jsx
import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import styles from './AdminClassPage.module.scss'; // Tạo file css ở bước 3
import { useNavigate } from 'react-router-dom';

const AdminClassPage = () => {
    // --- STATE ---
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const navigate = useNavigate();

    // Bộ lọc
    const [filters, setFilters] = useState({
        search: '',
        page: 1,
        limit: 10
    });

    // --- LOAD DATA ---
    const fetchClasses = async (isBackground = false) => {
        // Nếu là chạy ngầm (isBackground = true) thì KHÔNG hiện loading spinner
        if (!isBackground) setLoading(true);

        try {
            const params = { ...filters };
            if (!params.search) delete params.search;

            const res = await adminService.getAllClasses(params);

            // Cập nhật State (React sẽ tự so sánh và chỉ render lại nếu dữ liệu thay đổi)
            setClasses(res.data.classes);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error("Lỗi tải lớp học:", err);
        } finally {
            // Chỉ tắt loading nếu đang hiện
            if (!isBackground) setLoading(false);
        }
    };

    // --- 2. EFFECT 1: XỬ LÝ KHI NGƯỜI DÙNG THAY ĐỔI BỘ LỌC (DEBOUNCE) ---
    useEffect(() => {
        // Khi gõ phím hoặc chuyển trang -> Đợi 500ms rồi gọi API (Hiện Loading)
        const timeoutId = setTimeout(() => {
            fetchClasses(false);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [filters]); // Chạy lại khi filters thay đổi


    // --- 3. EFFECT 2: TỰ ĐỘNG CẬP NHẬT (POLLING) ---
    useEffect(() => {
        // Cứ mỗi 5 giây gọi API một lần (Chạy ngầm - Không Loading)
        const intervalId = setInterval(() => {
            fetchClasses(true);
        }, 5000);

        // Dọn dẹp khi thoát trang hoặc khi filters thay đổi (để tạo interval mới với filter mới)
        return () => clearInterval(intervalId);
    }, [filters]);

    // --- HANDLERS ---
    const handleSearchChange = (e) => {
        setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }));
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setFilters(prev => ({ ...prev, page: newPage }));
        }
    };

    const formatDate = (str) => new Date(str).toLocaleDateString('vi-VN');

    return (
        <div className={styles.container}>
            <h2>Quản lý Lớp học</h2>

            <div className={styles.contentSection}>
                {/* TOOLBAR */}
                <div className={styles.toolbar}>
                    <div className={styles.searchBox}>
                        <i className="fa-solid fa-search"></i>
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên lớp hoặc mã lớp..."
                            value={filters.search}
                            onChange={handleSearchChange}
                        />
                    </div>
                    {/* Có thể thêm nút Export hoặc Filter khác ở đây */}
                    <div className={styles.totalLabel}>Tổng: <strong>{pagination.total}</strong> lớp</div>
                </div>

                {/* TABLE */}
                {loading ? <p className={styles.loading}>Đang tải dữ liệu...</p> : (
                    <>
                        <div className={styles.tableContainer}>
                            <table className={styles.dataTable}>
                                <thead>
                                    <tr>
                                        <th>STT</th>
                                        <th>Tên lớp</th>
                                        <th>Mã lớp</th>
                                        <th>Giáo viên</th>
                                        <th>Sĩ số</th>
                                        <th>Số đề thi</th>
                                        <th>Ngày tạo</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {classes.length > 0 ? classes.map((cls, index) => (
                                        <tr key={cls.id}>
                                            <td>{(filters.page - 1) * filters.limit + index + 1}</td>
                                            <td>
                                                <strong className={styles.className}>{cls.name}</strong>
                                                <p className={styles.desc}>{cls.description || 'Không có mô tả'}</p>
                                            </td>
                                            <td><span className={styles.codeTag}>{cls.code}</span></td>
                                            <td>
                                                <div className={styles.teacherInfo}>
                                                    <span>{cls.teacher?.name}</span>
                                                    <small>{cls.teacher?.email}</small>
                                                </div>
                                            </td>
                                            <td className={styles.center}>{cls.student_count}</td>
                                            <td className={styles.center}>{cls.exam_count}</td>
                                            <td>{formatDate(cls.created_at)}</td>
                                            <td>
                                                <button
                                                    className={styles.btnView}
                                                    title="Xem chi tiết"
                                                    onClick={() => navigate(`/admin/classes/${cls.id}`)} // <--- THÊM SỰ KIỆN NÀY
                                                >
                                                    <i className="fa-solid fa-eye"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="8" align="center">Không tìm thấy lớp học nào.</td></tr>
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

export default AdminClassPage;