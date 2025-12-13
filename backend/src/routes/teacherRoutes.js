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
router.put("/questions/:id", teacherController.updateQuestion); // Cập nhật câu hỏi
router.delete("/questions/:id", teacherController.deleteQuestion); // Xóa câu hỏi
router.get("/questions/:id", teacherController.getQuestionById); // Lấy thông tin câu hỏi theo ID

router.post("/exam-templates", teacherController.createExamTemplate); // Tạo mẫu đề thi
router.get("/exam-templates", teacherController.getExamTemplatesByTeacher); // Lấy danh sách mẫu đề thi của giáo viên
router.put("/exam-templates", teacherController.updateExamTemplate); // Cập nhật mẫu đề thi
router.delete("/exam-templates/:id", teacherController.deleteExamTemplate); // Xóa mẫu đề thi

router.post("/exam-instances", teacherController.createExamInstance); // Tạo instance đề thi



module.exports = router;