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
            res.status(201).json({ newClass, message: "Lớp học đã được tạo thành công" });
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
            for (let i = 0; i < classData["listStudent"].length; i++) {
                const studentId = classData["listStudent"][i]["student_id"];
                const studentInfo = await require('../services/userService').getUserById(studentId);
                classData["listStudent"][i]["studentInfo"] = studentInfo;
            }
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
            res.json({ updatedClass, message: "Cập nhật lớp học thành công" });
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
            const result = await teacherService.approveEnrollmentRequest(requestId, status);
            res.json({ result, message: "Cập nhật trạng thái yêu cầu thành công" });
        } catch (error) {
            const err = new Error("Cập nhật trạng thái yêu cầu thất bại");
            err.status = 400;
            next(err);
        }
    },
    // Tạo câu hỏi

    /*
        Lưu ý: body có dạng 
        {
            text: "2 + 2 = ?",
            tags: ["math"],
            difficulty: "easy",
            explanation: "Cộng 2 và 2",
            choices: [
                { order: 1, text: "3", is_correct: false },
                { order: 2, text: "4", is_correct: true }
            ]
        }

    */
    async addQuestion(req, res, next) {
        try {
            const teacherId = req.user.id;
            
            const questionData = req.body || {};
            const questionFields = { ...questionData };
            if (!questionFields.text || typeof questionFields.text !== "string" || questionFields.text.trim().length === 0) {
                const err = new Error("Nội dung câu hỏi là bắt buộc");
                err.status = 400;
                throw err;
            }
            const { text, choices } = questionData;
            if (!text ||                                                                                                                                 typeof text !== "string" || !Array.isArray(choices) || choices.length < 2) {
                return res.status(400).json({ error: "Câu hỏi phải có nội dung và ít nhất 2 lựa chọn là bắt buộc" });
            }
            if (!choices.some(c => !!c.is_correct)) {
                return res.status(400).json({ error: "Ít nhất một lựa chọn phải có is_correct=true" });
            }
            // console.log("Adding question to classId:", classId);
            // console.log("Question data:", questionData);
            // console.log("User:", req.user);
            // res.status(501).json({ message: "Chức năng thêm câu hỏi chưa được triển khai" });
            const newQuestion = await teacherService.addQuestion( questionData, teacherId);
            res.status(201).json({ newQuestion, message: "Câu hỏi đã được thêm thành công" });
        } catch (error) {
            next(Object.assign(new Error("Thêm câu hỏi thất bại"), { status: 400, cause: error }));
        }
    },
    // Hiển thị danh sách câu hỏi
    async getQuestionsbyTeacher(req, res, next) {
        try {
            const teacherId = req.user.id;
            const questions = await teacherService.getQuestionsbyTeacher(teacherId);
            res.json(questions);
        } catch (error) {
            const err = new Error("Lấy danh sách câu hỏi thất bại");
            err.status = 400;
            next(err);
        }
    },
    // Chỉnh sửa câu hỏi - chưa xong
    async updateQuestion(req, res, next) {
        try {
            const questionId = req.params.id;
            const updateData = req.body || {};
            const questionFields = { ...updateData };
            if (!questionFields.text || typeof questionFields.text !== "string" || questionFields.text.trim().length === 0) {
                const err = new Error("Nội dung câu hỏi là bắt buộc");
                err.status = 400;
                throw err;
            }
            const { text, choices } = updateData;
            if (!text || typeof text !== "string" || !Array.isArray(choices) || choices.length < 2) {
                return res.status(400).json({ error: "Câu hỏi phải có nội dung và ít nhất 2 lựa chọn là bắt buộc" });
            }
            if (!choices.some(c => !!c.is_correct)) {
                return res.status(400).json({ error: "Ít nhất một lựa chọn phải có is_correct=true" });
            }
            console.log("Updating questionId:", questionId);
            console.log("Update data:", updateData);
            console.log("User:", req.user);
            const updatedQuestion = await teacherService.updateQuestion(questionId, updateData);
            res.json({ /*updatedQuestion,*/ message: "Cập nhật câu hỏi thành công" });
        } catch (error) {
            const err = new Error('Cập nhật câu hỏi thất bại');
            err.status = 400;
            next(err);
        }

    }
};