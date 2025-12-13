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
            if (!text || typeof text !== "string" || !Array.isArray(choices) || choices.length < 2) {
                return res.status(400).json({ error: "Câu hỏi phải có nội dung và ít nhất 2 lựa chọn là bắt buộc" });
            }
            if (!choices.some(c => !!c.is_correct)) {
                return res.status(400).json({ error: "Ít nhất một lựa chọn phải có is_correct=true" });
            }
            // console.log("Adding question to classId:", classId);
            // console.log("Question data:", questionData);
            // console.log("User:", req.user);
            // res.status(501).json({ message: "Chức năng thêm câu hỏi chưa được triển khai" });
            const newQuestion = await teacherService.addQuestion(questionData, teacherId);
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

    },

    // Xóa câu hỏi - Dat
    async deleteQuestion(req, res, next) {
        try {
            const questionId = req.params.id;
            const teacherId = req.user.id;
            console.log("Deleting questionId:", questionId);
            console.log("teacherid:", teacherId);
            await teacherService.deleteQuestion(questionId, teacherId);
            res.status(200).json({ message: "Xóa câu hỏi thành công" });
        } catch (error) {
            const err = new Error('Xóa câu hỏi thất bại');
            console.error("Error stack:", error.stack);
            err.status = 400;
            next(err);
        }
    },

    // lấy chi tiết câu hỏi theo ID cau hỏi - Dat
    async getQuestionById(req, res, next) {
        try {
            const questionId = req.params.id;
            const question = await teacherService.getQuestionById(questionId);
            res.json(question);
        } catch (error) {
            const err = new Error("Lấy chi tiết câu hỏi thất bại");
            err.status = 400;
            next(err);
        }
    },

    async createExamTemplate(req, res, next) {
        try {
            const teacherId = req.user.id;
            let { title, description, class_id, duration_seconds, shuffle_questions, passing_score } = req.body;

            // Convert kiểu dữ liệu
            if (duration_seconds) {
                duration_seconds = parseInt(duration_seconds, 10);
            }
            if (typeof shuffle_questions === 'string') {
                shuffle_questions = shuffle_questions.toLowerCase() === 'true';
            }
            if (passing_score) {
                passing_score = parseFloat(passing_score);
            }
            if (!title || typeof title !== "string" || title.trim().length === 0) {
                const err = new Error("Tiêu đề mẫu đề thi là bắt buộc");
                err.status = 400;
                throw err;
            }
            if (!class_id) {
                const err = new Error("Cần có mã lớp học để tạo mẫu đề thi");
                err.status = 400;
                throw err;
            }
            else {
                const classData = await teacherService.getClassById(class_id);
                console.log("Class data for validation:", classData);
                console.log("Teacher ID for validation:", teacherId,  classData.classInfo.teacher_id);
                if (!classData || classData.classInfo.teacher_id !== teacherId) {
                    const err = new Error("Lớp học không tồn tại hoặc bạn không có quyền thêm đề thi vào lớp này");
                    err.status = 403;
                    throw err;
                }
            }
            if (duration_seconds && (isNaN(duration_seconds) || duration_seconds <= 0)) {
                const err = new Error("Thời gian làm bài phải là số dương");
                err.status = 400;
                throw err;
            }
            if (passing_score && (isNaN(passing_score) || passing_score < 0 || passing_score > 100)) {
                const err = new Error("Điểm đạt phải là số từ 0 đến 100");
                err.status = 400;
                throw err;
            }

            const templateData = { title, description, class_id, duration_seconds, shuffle_questions, passing_score };
            console.log("Creating exam template with data:", templateData);
            console.log("Teacher ID:", teacherId);
            const newTemplate = await teacherService.createExamTemplate(templateData, class_id, teacherId);
            res.status(201).json({ newTemplate, message: "Mẫu đề thi đã được tạo thành công" });
        } catch (error) {
            console.error("createExamTemplate error:", error);
            console.error("Error stack:", error.stack);

            const err = new Error("Tạo mẫu đề thi thất bại");
            err.status = error.status || 400;
            err.cause = error.message;  // Gắn lỗi gốc vào
            next(err);
        }
    },
    async getExamTemplatesByTeacher(req, res, next) {
        try {
            const teacherId = req.user.id;
            const templates = await teacherService.getExamTemplate(teacherId);
            res.json(templates);
        } catch (error) {
            const err = new Error("Lấy danh sách mẫu đề thi thất bại");
            err.status = 400;
            next(err);
        }
    },
    // Cập nhật template 
    async updateExamTemplate(req, res, next) {
        try {
            const templateId = req.body.id;
            const updateData = req.body || {};
            const updatedTemplate = await teacherService.updateExamTemplate(templateId, updateData);
            res.json({ updatedTemplate, message: "Cập nhật mẫu đề thi thành công" });
        } catch (error) {
            console.error("updateExamTemplate error:", error);
            console.error("Error stack:", error.stack);
            const err = new Error("Cập nhật mẫu đề thi thất bại");
            err.status = 400;
            next(err);
        }
    },
    // Xóa template đề thi
    async deleteExamTemplate(req, res, next) {
        try {
            const templateId = req.params.id;
            const teacherId = req.user.id;
            await teacherService.deleteExamTemplate(templateId, teacherId);
            res.json({ message: "Xóa mẫu đề thi thành công" });
            res.status(200).end();
        } catch (error)
        {
            // console.error("deleteExamTemplate error:", error);
            // console.error("Error stack:", error.stack);
            // // const err = new Error("Xóa mẫu đề thi thất bại");
            // err.status = 400;
            next(error);
        }
    },


    // const questionData = req.body || {};
    // const questionFields = { ...questionData };
    // const newQuestion = await teacherService.addQuestion(questionData, teacherId);
    //         res.status(201).json({ newQuestion, message: "Câu hỏi đã được thêm thành công" });
    //     } catch (error) {
    //         next(Object.assign(new Error("Thêm câu hỏi thất bại"), { status: 400, cause: error }));
    //     }
    // }

    //tạo instance đề thi
    async createExamInstance(req, res, next) { {
        try {
            const teacherId = req.user.id;
            let { templateId, starts_at, ends_at, published } = req.body || {};

            // Convert kiểu dữ liệu
            if (typeof published === 'string') {
                published = published.toLowerCase() === 'true';
            }
            if (!templateId) {
                const err = new Error("Cần có mã mẫu đề thi để tạo đề thi");
                err.status = 400;
                throw err;
            }
            if (!starts_at || !ends_at) {
                const err = new Error("Thiếu thời gian bắt đầu hoặc kết thúc bài thi");
                err.status = 400;
                throw err;
            }
            const startDate = new Date(starts_at);
            const endDate = new Date(ends_at);
            if (startDate >= endDate) {
                const err = new Error("Thời gian bắt đầu phải trước thời gian kết thúc");
                err.status = 400;
                throw err;
            }
            const instanceData = req.body || {};
            const newInstance = await teacherService.addExam_instance(instanceData, teacherId);
            res.status(201).json({ newInstance, message: "Đề thi đã được tạo thành công" });
        } catch (error) {
            next(error);
        }
    }}

};

