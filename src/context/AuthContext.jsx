// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService'; // Import service vừa sửa

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Biến quan trọng để đợi load dữ liệu
    const navigate = useNavigate();

    // --- HÀM GỌI API SỐ 4: LẤY THÔNG TIN USER ---
    const fetchUserProfile = async () => {
        try {
            // Gọi hàm từ service (đã cấu hình axiosClient tự gắn token)
            const response = await authService.getCurrentUser();

            // Lưu thông tin user (id, name, email, role...) vào state
            setUser(response.data);
        } catch (error) {
            console.error("Không thể lấy thông tin user:", error);
            // Nếu token lỗi -> Xóa token và logout
            logout();
        } finally {
            // Dù thành công hay thất bại cũng tắt loading
            setLoading(false);
        }
    };

    // --- TỰ ĐỘNG GỌI API KHI F5 TRANG ---
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            fetchUserProfile(); // Có token thì gọi API lấy thông tin
        } else {
            setLoading(false); // Không có token thì dừng loading
        }
    }, []);

    // --- LOGIN ---
    const login = async (email, password) => {
        try {
            // 1. Gọi API Login
            const response = await authService.login({ email, password });
            const { token, refreshToken } = response.data;

            // 2. Lưu token
            localStorage.setItem('accessToken', token);
            localStorage.setItem('refreshToken', refreshToken);

            // 3. Gọi ngay API lấy thông tin chi tiết (để lấy name, role...)
            // Tại sao không dùng user từ response login? 
            // -> Vì đôi khi API login trả về ít thông tin hơn API /me
            const userResponse = await authService.getCurrentUser();
            const userData = userResponse.data;

            setUser(userData);

            // 4. Điều hướng
            if (userData.role_name === 'teacher') {
                navigate('/teacher/dashboard');
            } else {
                navigate('/student/dashboard');
            }
        } catch (error) {
            console.error("Login failed", error);
            throw error;
        }
    };

    // --- LOGOUT ---
    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
        navigate('/login');
    };

    // QUAN TRỌNG: Chỉ hiển thị giao diện khi đã tải xong thông tin user
    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};