// src/services/teacherService.js
import axiosClient from './axiosClient';

const teacherService = {
    // Endpoint 7: Tạo lớp học mới
    createClass(data) {
        // data: { name, description }
        return axiosClient.post('/api/teacher/classes', data);
    },

    // --- THÊM HÀM NÀY (Endpoint 8) ---
    // Endpoint 8: Lấy danh sách lớp của giáo viên
    getClasses() {
        // return axiosClient.get('/api/teacher/classes');
        return Promise.resolve({
            data: [
                {
                    "id": "a03cc090-d543-4474-96d5-1589d91f6027",
                    "teacher_id": "2f5d4ab2-d9a9-43f7-9175-9ec7f1ccc37c",
                    "name": "Mật mã ứng dụng",
                    "code": "tf7c2kbp",
                    "description": "Học sáng t3",
                    "created_at": "2025-12-02T01:28:39.768Z",
                    "updated_at": "2025-12-02T01:28:39.768Z"
                },
                {
                    "id": "dfbcd5a0-7b47-4bdb-a15a-ec5b162ffb5b",
                    "teacher_id": "2f5d4ab2-d9a9-43f7-9175-9ec7f1ccc37c",
                    "name": "Tin học đại cương",
                    "code": "wyld1h50",
                    "description": "Học lâp trình vào sáng t6",
                    "created_at": "2025-12-05T11:33:34.257Z",
                    "updated_at": "2025-12-05T11:33:34.257Z"
                }
            ]
        });
    },

    // --- THÊM HÀM NÀY (Endpoint 9) ---
    getClassDetail(id) {
        //1. Khi có backend
        // return axiosClient.get(`/api/teacher/classes/${id}`);
        // 2. Trả về dữ liệu giả lập(Mock Data) y hệt tài liệu
        if (id === 'a03cc090-d543-4474-96d5-1589d91f6027') {
            return Promise.resolve({
                data: {
                    "classInfo": {
                        "id": id, // Giữ ID để biết đang bấm vào lớp nào
                        "teacher_id": "2f5d4ab2",
                        "name": "Mật mã ứng dụng",
                        "code": "tf7c2kbp",
                        "description": "Học sáng t3",
                        "created_at": "2025-12-02T01:28:39.768Z",
                        "updated_at": "2025-12-02T01:28:39.768Z"
                    },
                    "listStudent": [
                        {
                            "id": "enroll-1",
                            "class_id": "a03cc090",
                            "student_id": "std-1",
                            "status": "approved",
                            "note": null,
                            "requested_at": "2025-12-02T02:01:49.561Z",
                            "studentInfo": {
                                "id": "std-1",
                                "email": "student1@gmail.com",
                                "name": "student11",
                                "role_name": "student"
                            }
                        },
                        {
                            "id": "enroll-2",
                            "class_id": "a03cc090",
                            "student_id": "std-2",
                            "status": "approved",
                            "note": "Em xin vào lớp",
                            "requested_at": "2025-12-06T10:00:00.000Z",
                            "studentInfo": {
                                "id": "std-2",
                                "email": "nguyenvanb@gmail.com",
                                "name": "Nguyễn Văn B",
                                "role_name": "student"
                            }
                        }
                    ]
                }
            });
        }
    },

    // Xóa lớp theo id
    deleteClass(id) {
        // --- KHI CÓ BACKEND: Bỏ comment dòng này ---
        // return axiosClient.delete(`/api/teacher/classes/${id}`);

        // --- MOCK DATA (Giả lập thành công) ---
        // API trả về 204 No Content (không có data body) nên ta chỉ cần resolve
        return Promise.resolve({
            status: 204
        });
    },

    // Endpoint 12: Lấy danh sách yêu cầu tham gia (Pending)
    getEnrollmentRequests(classId) {
        // --- KHI CÓ BACKEND: Bỏ comment dòng này ---
        // return axiosClient.get(`/api/teacher/classes/${classId}/enrollment-requests`);

        //--- MOCK DATA (Giả lập) ---
        return Promise.resolve({
            data: [
                {
                    "id": "req-1",
                    "class_id": classId,
                    "student_id": "std-pending-1",
                    "status": "pending",
                    "note": "Cô ơi cho em vào lớp với ạ",
                    "requested_at": "2025-12-06T15:19:31.916Z",
                    "studentInfo": { // Giả lập thêm thông tin sinh viên để hiển thị tên
                        "name": "Trần Văn Pending",
                        "email": "pending@gmail.com",
                        "avatar": null
                    }
                },
                {
                    "id": "req-2",
                    "class_id": classId,
                    "student_id": "std-pending-2",
                    "status": "pending",
                    "note": "Em là học sinh mới chuyển đến",
                    "requested_at": "2025-12-07T08:00:00.000Z",
                    "studentInfo": {
                        "name": "Lê Thị Chờ",
                        "email": "lethicho@gmail.com",
                        "avatar": null
                    }
                }
            ]
        });
    },

    // --- THÊM HÀM MỚI (Endpoint 13) ---
    respondToEnrollment(requestId, status) {
        // body: { status: "approved" | "rejected", requestId: "..." }
        const payload = { status, requestId };

        // --- KHI CÓ BACKEND: Bỏ comment dòng này ---
        // return axiosClient.post('/api/teacher/enrollment-requests/approve', payload);

        // --- MOCK DATA (Giả lập thành công) ---
        return Promise.resolve({
            status: 200,
            data: {
                result: { count: 1 },
                message: status === 'approved' ? "Đã duyệt yêu cầu" : "Đã từ chối yêu cầu"
            }
        });
    },

    // --- ENDPOINT 15: TẠO CÂU HỎI ---
    createQuestion(data) {
        // --- KHI CÓ BACKEND: Bỏ comment dòng này ---
        // return axiosClient.post('/api/teacher/questions', data);

        // --- MOCK DATA ---
        return Promise.resolve({
            status: 201,
            data: {
                message: "Câu hỏi đã được thêm thành công",
                newQuestion: {
                    id: "new-q-" + Date.now(),
                    owner_id: "teacher-123",
                    text: data.text,
                    explanation: data.explanation,
                    tags: data.tags,
                    difficulty: data.difficulty,
                    created_at: new Date().toISOString(),
                    question_choice: data.choices.map((c, index) => ({
                        id: "choice-" + index,
                        order: c.order,
                        text: c.text,
                        is_correct: c.is_correct
                    }))
                }
            }
        });
    },

    // --- ENDPOINT 16: LẤY DANH SÁCH CÂU HỎI ---
    getQuestions() {
        // --- KHI CÓ BACKEND: Bỏ comment dòng này ---
        // return axiosClient.get('/api/teacher/questions');

        // --- MOCK DATA ---
        return Promise.resolve({
            status: 200,
            data: [
                {
                    "id": "b8ff6f0f-2433-495d-b6fc-a79f2350402c",
                    "owner_id": "2f5d4ab2",
                    "text": "2 + 2 = ?",
                    "explanation": "Cộng 2 và 2",
                    "tags": ["math"],
                    "difficulty": "easy",
                    "created_at": "2025-12-05T13:52:38.380Z",
                    "question_choice": [
                        { "id": "c1", "order": 1, "text": "3", "is_correct": false },
                        { "id": "c2", "order": 2, "text": "4", "is_correct": true }
                    ]
                },
                {
                    "id": "69466a53-87a1-46fd-b79e-c3adeb44efd0",
                    "owner_id": "2f5d4ab2",
                    "text": "Thủ đô của Việt Nam là gì?",
                    "explanation": "Kiến thức địa lý cơ bản",
                    "tags": ["dia-ly", "viet-nam"],
                    "difficulty": "medium",
                    "created_at": "2025-12-05T13:50:54.612Z",
                    "question_choice": [
                        { "id": "c3", "order": 1, "text": "Hồ Chí Minh", "is_correct": false },
                        { "id": "c4", "order": 2, "text": "Hà Nội", "is_correct": true }
                    ]
                }
            ]
        });
    },

    // --- THÊM MỚI: ENDPOINT 17 (SỬA CÂU HỎI) ---
    updateQuestion(id, data) {
        // --- KHI CÓ BACKEND: Bỏ comment dòng này ---
        // return axiosClient.put(`/api/teacher/questions/${id}`, data);

        // --- MOCK DATA ---
        return Promise.resolve({
            status: 200,
            data: { message: "Cập nhật câu hỏi thành công" }
        });
    },

    // --- THÊM MỚI: ENDPOINT 18 (XÓA CÂU HỎI) ---
    deleteQuestion(id) {
        // --- KHI CÓ BACKEND: Bỏ comment dòng này ---
        // return axiosClient.delete(`/api/teacher/questions/${id}`);

        // --- MOCK DATA ---
        return Promise.resolve({
            status: 200,
            data: { message: "Xóa câu hỏi thành công" }
        });
    },

    // --- ENDPOINT 19: LẤY CHI TIẾT CÂU HỎI ---
    getQuestionDetail(id) {
        // --- KHI CÓ BACKEND: Bỏ comment dòng này ---
        // return axiosClient.get(`/api/teacher/questions/${id}`);

        // --- MOCK DATA (Giả lập theo Response body bạn cung cấp) ---
        return Promise.resolve({
            status: 200,
            data: [ // API trả về mảng chứa 1 object
                {
                    "id": id,
                    "owner_id": "teacher-123",
                    "text": "TCP có phải là giao thức hướng kết nối không?",
                    "explanation": "TCP thực hiện quá trình bắt tay 3 bước để tạo kết nối trước khi truyền dữ liệu.",
                    "tags": ["network", "tcp", "protocol"],
                    "difficulty": "medium",
                    "created_at": "2025-12-10T17:29:54.796Z",
                    "updated_at": "2025-12-10T17:29:54.796Z",
                    "question_choice": [
                        { "id": "c1", "label": "A", "order": 0, "text": "Đúng", "is_correct": true },
                        { "id": "c2", "label": "B", "order": 1, "text": "Sai", "is_correct": false }
                    ]
                }
            ]
        });
    },

    // (Các API khác như lấy danh sách lớp, thống kê... sẽ thêm sau)
    getDashboardData() {
        // Giả lập hoặc gọi API thật nếu có
        return Promise.resolve({ data: { /* ... */ } });
    }
};

export default teacherService;