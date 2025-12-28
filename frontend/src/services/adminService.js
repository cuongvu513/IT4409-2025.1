// src/services/adminService.js
import axiosClient from './axiosClient';

const adminService = {
    // --- ENDPOINT 9: LẤY THỐNG KÊ DASHBOARD ---
    getDashboardStats() {
        return axiosClient.get('/api/admin/dashboard');
    },

    // endpoint dùng cho quản lí users
    getUserStats() {
        return axiosClient.get('/api/admin/statistics');
    },

    getUsers(params) {
        return axiosClient.get('/api/admin/users', { params });
    },

    lockUser(userId) {

        return axiosClient.put(`/api/admin/users/${userId}/lock`);

    },

    unlockUser(userId) {
        return axiosClient.put(`/api/admin/users/${userId}/unlock`);
    },

    // --- ENDPOINT 6: RESET MẬT KHẨU ---
    resetUserPassword(userId, newPassword) {
        const payload = newPassword ? { password: newPassword } : {};
        return axiosClient.post(`/api/admin/users/${userId}/reset-password`, payload);

    },

    // endpoint dùng cho quản lí classes
    getAllClasses(params) {
        return axiosClient.get('/api/admin/classes', { params });

    },

    getClassDetail(id) {
        return axiosClient.get(`/api/admin/classes/${id}`);
    }
};

export default adminService;