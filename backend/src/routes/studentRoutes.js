const studentController = require("../controllers/studentController");
const express = require("express");
const router = express.Router();

router.post("/enroll", studentController.joinClass);
router.get("/classes", studentController.getEnrolledClasses);
router.delete("/classes/:id", studentController.leaveClass);   // Rời lớp học
router.get("/exams/classes/:id", studentController.getExamsByClass);    // Lấy danh sách đề thi theo lớp học

module.exports = router;
