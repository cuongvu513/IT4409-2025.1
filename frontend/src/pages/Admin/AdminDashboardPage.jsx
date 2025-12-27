import React from 'react';

const AdminDashboardPage = () => {
    return (
        <div style={{ padding: '30px' }}>
            <h2>Tổng quan hệ thống</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '20px' }}>
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                    <h3>Người dùng</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>1,250</p>
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                    <h3>Lớp học</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>45</p>
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                    <h3>Truy cập hôm nay</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffc107' }}>320</p>
                </div>
            </div>
        </div>
    );
};
export default AdminDashboardPage;