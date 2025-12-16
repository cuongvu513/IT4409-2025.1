import axiosClient from './axiosClient';

const authService = {
    // API 1: Đăng ký
    register(data) {
        // su dung khi co backend
        return axiosClient.post('/api/auth/register', data);
        // return Promise.resolve({
        //     data: [
        //         {
        //             "message": "User registered successfully"
        //         }
        //     ]
        // });

    },

    // API 2: Đăng nhập
    login(data) {
        // su dung khi co backend
        return axiosClient.post('/api/auth/login', data);

        // const isTeacher = data.email.includes('teacher');

        // return Promise.resolve({
        //     status: 200,
        //     data: {
        //         message: "Login successful",
        //         token: "mock-access-token-123",
        //         refreshToken: "mock-refresh-token-123",
        //         user: {
        //             id: "user-123",
        //             email: data.email,
        //             name: isTeacher ? "Cô Giáo Thảo" : "Em Học Sinh",
        //             role_name: isTeacher ? "teacher" : "student" // Quan trọng để điều hướng
        //         }
        //     }
        // });
    },

    // API 3: Refresh Token
    refreshToken(refreshToken) {
        return axiosClient.post('/api/auth/refresh', { refreshToken });
    },

    // API 4: Lấy thông tin user hiện tại
    getCurrentUser() {
        //su dung khi co backend that
        return axiosClient.get('/auth/users/me');

        // return Promise.resolve({
        //     data: {
        //         id: "user-123",
        //         email: "test@gmail.com",
        //         name: "Người Dùng Test (Mock)",
        //         // Sửa thành "teacher" nếu muốn test Dashboard Giáo viên
        //         // Sửa thành "student" nếu muốn test Dashboard Học sinh
        //         role_name: "teacher",
        //         is_active: true
        //     }
        // });
    }
};

export default authService;