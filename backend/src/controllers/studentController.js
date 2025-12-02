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
            const classes = await studentService.getEnrolledClasses(studentId);
            res.json(classes);
        } catch (error) {
            const err = new Error("Lấy danh sách lớp học thất bại");
            err.status = 400;
            next(err);
        }
    }
};