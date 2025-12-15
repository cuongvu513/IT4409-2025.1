// src/services/teacherService.js
import axiosClient from './axiosClient';

const teacherService = {
    // Endpoint 7: Tạo lớp học mới
    createClass(data) {
        // data: { name, description }
        return axiosClient.post('/api/teacher/classes', data);
    },

    // (Các API khác như lấy danh sách lớp, thống kê... sẽ thêm sau)
    getDashboardData() {
        // Giả lập hoặc gọi API thật nếu có
        return Promise.resolve({ data: { /* ... */ } });
    }
};

export default teacherService;