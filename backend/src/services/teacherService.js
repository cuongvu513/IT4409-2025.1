const prisma = require("../prisma");
const userService = require("../services/userService");

module.exports = {
    // Tạo lớp học mới
    async createClass(name, description, teacherId, classCode) {
        const newClass = await prisma.Renamedclass.create({
            data: {
                name,
                description,
                teacher_id: teacherId,
                code: classCode,
            },
        });
        return newClass;
    },
    // Lấy danh sách lớp học của giáo viên
    async getClassesByTeacher(teacherId) {
        const classes = await prisma.Renamedclass.findMany({
            where: { teacher_id: teacherId },
        });
        return classes;
    },
    // Lấy thông tin lớp học theo ID
    async getClassById(classId) {
        const classInfo = await prisma.Renamedclass.findFirst({
            where: { id: classId },
        });
        const listStudent = await prisma.enrollment_request.findMany({
            where: { class_id: classId, status: "approved" },
        });
        return { classInfo, listStudent };
    },
    // Cập nhật thông tin lớp học
    async updateClass(classId, updateData) {
        updateData.updated_at = new Date();
        updateData.code = undefined; // Không cho phép cập nhật mã lớp
        const updatedClass = await prisma.Renamedclass.update({
            where: { id: classId },
            data: updateData,
        });
        return updatedClass;
    },
    // Xóa lớp học
    async deleteClass(classId, teacherId) {
        await prisma.Renamedclass.delete({
            where: { id: classId, teacher_id: teacherId },
        });
        return;
    },
    // Hiển thị danh sách yêu cầu tham gia lớp học
    async getEnrollmentRequests(classId, teacherId) {
        const requests = await prisma.enrollment_request.findMany({
            where: { class_id: classId, status: "pending", Renamedclass: { teacher_id: teacherId } },
        });
        return requests;
    },
    // Phê duyệt hoặc từ chối yêu cầu tham gia lớp học
    async approveEnrollmentRequest(requestId, status) {
        const request = await prisma.enrollment_request.updateMany({
            where: { id: requestId },
            data: { status: status },
        });
        return request;
    },
    // Tạo thêm câu hỏi
    async addQuestion(classId, questionData, actorId) {
        if (!classId) {
            const err = new Error("ID lớp học là bắt buộc");
            err.status = 400;
            throw err;
        }

        const { choices = [], ...questionFields } = questionData;

        return await prisma.$transaction(async (tx) => {
            // Kiểm tra lớp học tồn tại và quyền của giáo viên
            const cls = await tx.Renamedclass.findUnique({ where: { id: classId } });
            if (!cls) {
                const err = new Error("Lớp không tồn tại");
                err.status = 404;
                throw err;
            }

            // kiểm tra quyền 
            if (actorId && cls.teacher_id && cls.teacher_id !== actorId) {
                const err = new Error("Bạn không có quyền thêm câu hỏi vào lớp học này");
                err.status = 403;
                throw err;
            }

            // kiểm tra trường câu hỏi
            if (!questionFields.text || typeof questionFields.text !== "string" || questionFields.text.trim().length === 0) {
                const err = new Error("Nội dung câu hỏi là bắt buộc");
                err.status = 400;
                throw err;
            }

            // 1. Tạo câu hỏi
            const createData = {
                text: questionFields.text.trim(),
                explanation: questionFields.explanation ?? null,
                tags: Array.isArray(questionFields.tags) ? questionFields.tags : [],
                difficulty: questionFields.difficulty ?? "medium",
                user: { connect: { id: actorId } }
            };

            const newQuestion = await tx.question.create({
                data: createData,
            });

            // 2. Tạo danh sách đáp án (chuẩn hoá input)
            if (Array.isArray(choices) && choices.length > 0) {
                const mapped = choices.map((c, i) => ({
                    question_id: newQuestion.id,
                    label: c.label ?? null,
                    order: c.order ?? i,
                    text: c.text ?? "",
                    is_correct: !!c.is_correct,
                }));

                await tx.question_choice.createMany({
                    data: mapped,
                    skipDuplicates: true,
                });
            }

            // 3. Trả về question kèm danh sách choices vừa tạo (consistent shape)
            const result = await tx.question.findUnique({
                where: { id: newQuestion.id },
                include: {
                    question_choice: {
                        orderBy: { order: "asc" }
                    }
                }
            });

            return result;
        });
    },
    // Lấy danh sách câu hỏi theo lớp học
    async getQuestionsbyTeacher(teacherId) {
        if (!teacherId) {
            const err = new Error("Vui lòng nhập mã giáo viên");
            err.status = 400;
            throw err;
        }
        const questions = await prisma.question.findMany({
            where: { owner_id: teacherId },
            include: {
                question_choice: {
                    orderBy: { order: "asc" }
                }
            },
            orderBy: { created_at: "desc" }
        });
        return questions;
    }
};