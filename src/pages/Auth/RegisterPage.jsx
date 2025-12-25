// src/pages/Auth/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import styles from './RegisterPage.module.scss';

const RegisterPage = () => {
    const navigate = useNavigate();

    // State quản lý các bước (1: Nhập info, 2: Nhập OTP)
    const [step, setStep] = useState(1);

    // State dữ liệu Form
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role_name: 'student' // Mặc định là học sinh
    });

    // State OTP
    const [otp, setOtp] = useState('');

    // State UI
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Xử lý nhập liệu Form Bước 1
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- XỬ LÝ BƯỚC 1: GỬI YÊU CẦU ĐĂNG KÝ ---
    const handleRegisterRequest = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        // Validate cơ bản
        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu nhập lại không khớp!');
            return;
        }
        if (formData.password.length < 8) {
            setError('Mật khẩu phải có ít nhất 8 ký tự.');
            return;
        }

        setLoading(true);
        try {
            // Gọi API 1.1
            const payload = {
                email: formData.email,
                name: formData.name,
                password: formData.password,
                role_name: formData.role_name
            };

            const res = await authService.registerRequest(payload);

            // Thành công -> Chuyển sang bước nhập OTP
            setSuccessMessage(res.data.message || "OTP đã được gửi đến email của bạn.");
            setStep(2);

        } catch (err) {
            setError(err.response?.data?.error || "Đăng ký thất bại.");
        } finally {
            setLoading(false);
        }
    };

    // --- XỬ LÝ BƯỚC 2: XÁC THỰC OTP ---
    const handleConfirmOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Gọi API 1.2
            const payload = {
                email: formData.email, // Lấy email từ state bước 1
                otp: otp
            };

            const res = await authService.registerConfirm(payload);

            alert(res.data.message || "Đăng ký thành công! Vui lòng đăng nhập.");
            navigate('/login'); // Chuyển hướng về trang login

        } catch (err) {
            setError(err.response?.data?.error || "Mã OTP không đúng hoặc đã hết hạn.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.registerContainer}>
            <div className={styles.registerForm}>
                <div className={styles.formHeader}>
                    <h2>{step === 1 ? 'Đăng ký tài khoản' : 'Xác thực OTP'}</h2>
                    <p>{step === 1 ? 'Chào mừng bạn đến với EduTest' : `Mã OTP đã gửi tới: ${formData.email}`}</p>
                </div>

                {/* Hiển thị lỗi hoặc thông báo thành công */}
                {error && <div className={styles.alertError}>{error}</div>}
                {successMessage && <div className={styles.alertSuccess}>{successMessage}</div>}

                {/* --- GIAO DIỆN BƯỚC 1 --- */}
                {step === 1 && (
                    <form onSubmit={handleRegisterRequest}>
                        <div className={styles.formGroup}>
                            <label>Họ và tên</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
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
                                placeholder="student@example.com"
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
                                name="role_name"
                                value={formData.role_name}
                                onChange={handleChange}
                                className={styles.selectInput}
                            >
                                <option value="student">Học sinh</option>
                                <option value="teacher">Giáo viên</option>
                            </select>
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? 'Đang xử lý...' : 'Tiếp tục'}
                        </button>
                    </form>
                )}

                {/* --- GIAO DIỆN BƯỚC 2 (OTP) --- */}
                {step === 2 && (
                    <form onSubmit={handleConfirmOtp}>
                        <div className={styles.formGroup}>
                            <label>Nhập mã OTP</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                placeholder="Nhập mã 6 số"
                                style={{ textAlign: 'center', letterSpacing: '2px', fontSize: '1.2rem' }}
                            />
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? 'Đang xác thực...' : 'Hoàn tất đăng ký'}
                        </button>

                        <div className={styles.formFooter}>
                            <span
                                style={{ color: '#007bff', cursor: 'pointer', fontSize: '0.9rem' }}
                                onClick={() => setStep(1)}
                            >
                                ← Quay lại sửa thông tin
                            </span>
                        </div>
                    </form>
                )}

                {step === 1 && (
                    <div className={styles.formFooter}>
                        <p>Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link></p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RegisterPage;