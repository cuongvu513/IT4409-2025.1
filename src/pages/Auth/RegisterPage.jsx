// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import styles from './RegisterPage.module.scss'; // Import CSS Module

const RegisterPage = () => {
    const navigate = useNavigate();

    // State quản lý dữ liệu form
    const [formData, setFormData] = useState({
        fullName: '',      // UI hiển thị "Họ và tên"
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student',   // Mặc định là học sinh
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    // Xử lý khi người dùng nhập liệu
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Xử lý khi nhấn Đăng ký
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        // 1. Validate mật khẩu nhập lại
        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu nhập lại không khớp!');
            setLoading(false);
            return;
        }

        // 2. Chuẩn bị dữ liệu đúng format API yêu cầu
        // API yêu cầu: { email, name, password, role_name }
        const payload = {
            email: formData.email,
            name: formData.fullName,   // Map 'fullName' -> 'name'
            password: formData.password,
            role_name: formData.role   // Map 'role' -> 'role_name'
        };

        try {
            // 3. Gọi API
            const response = await authService.register(payload);

            // 4. Xử lý thành công (HTTP 201)
            setSuccess(response.data.message || 'Đăng ký thành công!');

            // Chuyển hướng sang trang login sau 2 giây
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (err) {
            // 5. Xử lý lỗi (HTTP 400, 500...)
            // API trả về lỗi dạng: { "error": "Mô tả lỗi" }
            const errorMsg = err.response?.data?.error || 'Đăng ký thất bại. Vui lòng thử lại!';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.registerContainer}>
            <form className={styles.registerForm} onSubmit={handleSubmit}>
                <div className={styles.formHeader}>
                    <h2>Đăng ký tài khoản</h2>
                    <p>Chào mừng bạn đến với lớp học!</p>
                </div>

                {/* Thông báo lỗi & thành công */}
                {error && <div className={styles.alertError}>{error}</div>}
                {success && <div className={styles.alertSuccess}>{success}</div>}

                <div className={styles.formGroup}>
                    <label>Họ và tên</label>
                    <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                        placeholder="Nguyễn Văn A"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="email@example.com"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Mật khẩu</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={8}
                        placeholder="Tối thiểu 8 ký tự"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Nhập lại mật khẩu</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        placeholder="Xác nhận mật khẩu"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Vai trò</label>
                    <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className={styles.selectInput}
                    >
                        {/* Value phải khớp với 'role_name' API chấp nhận */}
                        <option value="student">Học sinh (Student)</option>
                        <option value="teacher">Giáo viên (Teacher)</option>
                    </select>
                </div>

                <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={loading}
                >
                    {loading ? 'Đang xử lý...' : 'Đăng ký ngay'}
                </button>

                <div className={styles.formFooter}>
                    <p>Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
                </div>
            </form>
        </div>
    );
};

export default RegisterPage;