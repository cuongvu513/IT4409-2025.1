const teacherService = require('../services/teacherService');
const crypto = require('crypto');

function generateRandomCode(len = 8) {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    const bytes = crypto.randomBytes(len);
    let out = "";
    for (let i = 0; i < len; i++) {
        out += chars[bytes[i] % chars.length];
    }
    return out;
}
module.exports = {
    // Tạo lớp học mới  
    async createClass(req, res, next) {
        try {
            const { name, description } = req.body;
            const classCode = generateRandomCode(8);
            const teacherId = req.user.id; // Giả sử bạn có thông tin giáo viên trong req.user
            const newClass = await teacherService.createClass(name, description, teacherId, classCode);
            res.status(201).json({newClass,message:"Lớp học đã được tạo thành công"});
        } catch (error) {
            const err = new Error("Tạo lớp học thất bại");
            err.status = 400;
            next(err);
        }
    },
    //Hiển thị danh sách lớp học của giáo viên
    async getClassesByTeacher(req, res, next) {
        try {
            const teacherId = req.user.id;
            const classes = await teacherService.getClassesByTeacher(teacherId);
            res.json(classes);
        } catch (error) {
            const err = new Error("Lấy danh sách lớp học thất bại");
            err.status = 400;
            next(err);
        }
    },
    // Lấy thông tin lớp học theo ID
    async getClassById(req, res, next) {
        try {
            const classId = (req.params.id);
            const classData = await teacherService.getClassById(classId);
            res.json(classData);
        } catch (error) {
            const err = new Error("Lấy thông tin lớp học thất bại");
            err.status = 400;
            next(err);
        }
    },
    // Cập nhật thông tin lớp học
    async updateClass(req, res, next) {
        try {
            const classId = (req.params.id);
            const updateData = req.body;
            const updatedClass = await teacherService.updateClass(classId, updateData);
            res.json({updatedClass,message:"Cập nhật lớp học thành công"});
        } catch (error) {
            const err = new Error('Cập nhật thất bại');
            err.status = 400;
            next(err);
        }
    },
    // Xóa lớp học
    async deleteClass(req, res, next) {
        try {
            const classId = (req.params.id);
            const teacherId = req.user.id;
            await teacherService.deleteClass(classId, teacherId);
            res.status(204).end();
        } catch (error) {
            const err = new Error('Xóa lớp học thất bại');
            err.status = 400;
            next(err);
        }
    },
    // Hiển thị danh sách yêu cầu tham gia lớp học
    async getEnrollmentRequests(req, res, next) {
        try {
            const classId = (req.params.id);
            const teacherId = req.user.id;
            const requests = await teacherService.getEnrollmentRequests(classId, teacherId);
            res.json(requests);
        } catch (error) {
            const err = new Error("Lấy danh sách yêu cầu tham gia lớp học thất bại");
            err.status = 400;
            next(err);
        }
    },
    // Phê duyệt hoặc từ chối yêu cầu tham gia lớp học
    async approveEnrollmentRequest(req, res, next) {
        try {
            const { status, requestId } = req.body; // 'approved' hoặc 'rejected'
            // const teacherId = req.user.id;
            const result = await teacherService.approveEnrollmentRequest(requestId,  status);
            res.json({result,message:"Cập nhật trạng thái yêu cầu thành công"});
        } catch (error) {
            const err = new Error("Cập nhật trạng thái yêu cầu thất bại");
            err.status = 400;
            next(err);
        }
    },
};  