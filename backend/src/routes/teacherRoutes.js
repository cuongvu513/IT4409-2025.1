const teacherController = require("../controllers/teacherController");
const express = require("express");
const router = express.Router();

router.post("/classes", teacherController.createClass); // Tạo lớp học mới
router.get("/classes", teacherController.getClassesByTeacher); // Lấy danh sách lớp học của giáo viên
router.get("/classes/:id", teacherController.getClassById); // Lấy thông tin lớp học theo ID
router.put("/classes/:id", teacherController.updateClass); // Cập nhật thông tin lớp học
router.delete("/classes/:id", teacherController.deleteClass); // Xóa lớp học
router.get("/classes/:id/enrollment-requests", teacherController.getEnrollmentRequests); // Lấy danh sách yêu cầu tham gia lớp học
router.post("/enrollment-requests/approve", teacherController.approveEnrollmentRequest); // Phê duyệt hoặc từ chối yêu cầu tham gia lớp học
router.post("/questions", teacherController.addQuestion); // Tạo câu hỏi 
router.get("/questions", teacherController.getQuestionsbyTeacher); // Lấy danh sách câu hỏi theo lớp học

module.exports = router;