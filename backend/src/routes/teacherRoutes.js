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
router.get("/questions", teacherController.getQuestionsbyTeacher); // Lấy danh sách câu hỏi theo id giáo viên
router.put("/questions/:id", teacherController.updateQuestion); // Cập nhật câu hỏi
router.delete("/questions/:id", teacherController.deleteQuestion); // Xóa câu hỏi
router.get("/questions/:id", teacherController.getQuestionById); // Lấy thông tin câu hỏi theo ID

router.post("/exam-templates", teacherController.createExamTemplate); // Tạo mẫu đề thi
router.get("/exam-templates", teacherController.getExamTemplatesByTeacher); // Lấy danh sách mẫu đề thi của giáo viên
router.put("/exam-templates/:id", teacherController.updateExamTemplate); // Cập nhật mẫu đề thi
router.delete("/exam-templates/:id", teacherController.deleteExamTemplate); // Xóa mẫu đề thi
router.get("/exam-templates/search", teacherController.searchExamTemplates); // Tìm kiếm mẫu đề thi theo từ khóa
router.get("/exam-templates/:id", teacherController.getExamTemplateById); // Lấy thông tin mẫu đề thi theo ID

router.post("/exam-instances", teacherController.createExamInstance); // Tạo instance đề thi
router.delete("/exam-instances/:id", teacherController.deleteExamInstance); // Xóa instance đề thi
router.get("/exam-templates/:templateId/exam-instances", teacherController.getExamInstancesByTemplate); // Lấy danh sách instance đề thi theo template  
router.put("/exam-instances/:id", teacherController.updateExamInstance); // Cập nhật instance đề thi
router.get("/exam-instances/:id", teacherController.getExamInstanceById); // Lấy thông tin instance đề thi theo ID
router.get("/classes/:classId/students",teacherController.searchStudentsInClass); // Tìm kiếm sinh viên trong lớp học theo tên
router.post("/exam-instances/:id/publish", teacherController.publishExamInstance); // Công bố đề thi



module.exports = router;