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
    async addQuestion( questionData, actorId) {

        const { choices = [], ...questionFields } = questionData;

        return await prisma.$transaction(async (tx) => {
            // Kiểm tra lớp học tồn tại và quyền của giáo viên

            // kiểm tra trường câu hỏi

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
    },
    // Cập nhật câu hỏi
    async updateQuestion(questionId, updateData) {
        const { choices = [], ...questionFields } = updateData;

        return await prisma.$transaction(async (tx) => {
            // Lấy question hiện tại kèm choices
            const existing = await tx.question.findFirst({
                where: { id: questionId },
                include: { question_choice: true }
            });

            if (!existing) {
                const err = new Error("Question not found");
                err.status = 404;
                throw err;
            }

            // Chuẩn bị dữ liệu cập nhật cho question
            const qUpdate = { updated_at: new Date() };
            if (questionFields.text !== undefined) qUpdate.text = questionFields.text?.trim();
            if (Object.prototype.hasOwnProperty.call(questionFields, "explanation")) qUpdate.explanation = questionFields.explanation ?? null;
            if (Object.prototype.hasOwnProperty.call(questionFields, "tags")) qUpdate.tags = Array.isArray(questionFields.tags) ? questionFields.tags : [];
            if (Object.prototype.hasOwnProperty.call(questionFields, "difficulty")) qUpdate.difficulty = questionFields.difficulty ?? "medium";

            await tx.question.update({
                where: { id: questionId },
                data: qUpdate,
            });

            // Xử lý choices: update existing, create new, delete đã bị remove
            const existingChoices = existing.question_choice || [];
            const existingById = new Map(existingChoices.map(c => [c.id, c]));
            const providedIds = new Set();

            for (let i = 0; i < choices.length; i++) {
                const c = choices[i];
                const order = c.order ?? i;

                if (c.id) {
                    // Nếu id được cung cấp phải thuộc question này
                    if (!existingById.has(c.id)) {
                        const err = new Error(`Invalid choice id: ${c.id}`);
                        err.status = 400;
                        throw err;
                    }
                    providedIds.add(c.id);
                    await tx.question_choice.update({
                        where: { id: c.id },
                        data: {
                            label: c.label ?? null,
                            order,
                            text: c.text ?? "",
                            is_correct: !!c.is_correct,
                        }
                    });
                } else {
                    // Tạo mới choice
                    await tx.question_choice.create({
                        data: {
                            question_id: questionId,
                            label: c.label ?? null,
                            order,
                            text: c.text ?? "",
                            is_correct: !!c.is_correct,
                        }
                    });
                }
            }

            // Xóa các choice không còn trong payload
            const idsToDelete = existingChoices
                .map(c => c.id)
                .filter(id => !providedIds.has(id));

            if (idsToDelete.length > 0) {
                await tx.question_choice.deleteMany({
                    where: { id: { in: idsToDelete } }
                });
            }

            // Trả về question kèm choices đã sắp xếp
            const result = await tx.question.findUnique({
                where: { id: questionId },
                include: {
                    question_choice: {
                        orderBy: { order: "asc" }
                    }
                }
            });

            return result;
        });
    }
};
