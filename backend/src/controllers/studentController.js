const studentService = require("../services/studentService");

module.exports = {
    // Tham gia lớp học bằng mã lớp
    async joinClass(req, res, next) {
        try {
            const studentId = req.user.id;
            const { classCode, note } = req.body;
            const enrollmentRequest = await studentService.joinClass(studentId, classCode, note);
            res.status(201).json({ enrollmentRequest, message: "Yêu cầu tham gia lớp học đã được gửi" });
        } catch (error) {
            const err = new Error("Tham gia lớp học thất bại: " + error.message);
            err.status = 400;
            next(err);
        }
    },
    // Lấy danh sách lớp học đã tham gia
    async getEnrolledClasses(req, res, next) {
        try {
            const studentId = req.user.id;
            const status = req.query.status;
            const classes = await studentService.getEnrolledClasses(studentId, status);
            res.json(classes);
        } catch (error) {
            next(error);
        }
    },
    // Rời lớp học
    async leaveClass(req, res, next) {
        try {
            const studentId = req.user.id;
            const classId = req.params.id;
            await studentService.leaveClass(studentId, classId);
            res.status(204).end();
        } catch (error) {
            const err = new Error("Rời lớp học thất bại");
            err.status = 400;
            next(err);
        }
    },

    // Lấy danh sách đề thi đã publish theo lớp
    async getClassExams(req, res, next) {
        try {
            const studentId = req.user.id;
            const classId = req.params.id;
            const exams = await studentService.getStudentExams(studentId, classId);
            res.json(exams);
        } catch (error) {
            const status = error.status || 400;
            const err = new Error("Lấy danh sách đề thi thất bại: " + error.message);
            err.status = status;
            next(err);
        }
    }
};