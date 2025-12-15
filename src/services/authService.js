import axiosClient from './axiosClient';

const authService = {
    // API 1: Đăng ký
    register(data) {
        return axiosClient.post('/api/auth/register', data);
    },

    // API 2: Đăng nhập
    login(data) {
        return axiosClient.post('/api/auth/login', data);
    },

    // API 3: Refresh Token
    refreshToken(refreshToken) {
        return axiosClient.post('/api/auth/refresh', { refreshToken });
    },

    // API 4: Lấy thông tin user hiện tại
    getCurrentUser() {
        return axiosClient.get('/auth/users/me');
    }
};

export default authService;