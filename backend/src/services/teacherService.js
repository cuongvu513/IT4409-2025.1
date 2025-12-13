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
    // Lấy danh sách câu hỏi theo giáo viên
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
    },

    // Xóa câu hỏi 
    // async deleteQuestion(questionId) {
    //     return await prisma.$transaction(async (tx) => {
            
    //         await tx.question_choice.deleteMany({
    //             where: { question_id: questionId }
    //         });

    //         await tx.question.delete({
    //             where: { id: questionId }
    //         });

    //         return;
    //     });
    // },
    
    //xóa câu hỏi - dat
    async deleteQuestion(questionId, teacherId) {
        return await prisma.$transaction(async (tx) => {

            // 1. Check quyền sở hữu 
            const question = await tx.question.findFirst({
                where: {
                    id: questionId,
                    owner_id: teacherId
                }
            });

            if (!question) {
                throw new Error("Không tìm thấy câu hỏi hoặc không có quyền xóa");
            }

            // 2. XÓA liên kết đề thi - câu hỏi (nếu câu hỏi đang ở trong 1 đề thi nào đó)
            await tx.exam_question.deleteMany({
                where: { question_id: questionId }
            });

            // 3. Xóa đáp án
            await tx.question_choice.deleteMany({
                where: { question_id: questionId }
            });

            // 4. Xóa câu hỏi
            await tx.question.delete({
                where: { id: questionId }
            });

            return true;
        });
    },

    // lấy chi tiết câu hỏi theo ID
    async getQuestionById(questionId, teacherId) {
        const question = await prisma.question.findFirst({
            where: { id: questionId, owner_id: teacherId },
            include: {
                question_choice: {
                    orderBy: { order: "asc" }
                    
                }
            }
        });
        return question;
    },

    // Tạo template đề thi
    async createExamTemplate(templateData, class_id, actorId) {
        const { questions = [], ...templateFields } = templateData;
        return await prisma.$transaction(async (tx) => {
            // Kiểm tra lớp học tồn tại và quyền của giáo viên
            const classInfo = await tx.Renamedclass.findFirst({
                where: { id: class_id }
            }); 
            console.log("classInfo in createExamTemplate:", classInfo);
            if (!classInfo) {
                const err = new Error("Lớp học không tồn tại");
                err.status = 404;
                throw err;
            }
            // Tạo template câu hỏi
            const createData = {
                title: templateFields.title?.trim() ,
                description: templateFields.description ?? null,
                Renamedclass: { connect: { id: class_id } },
                duration_seconds: templateFields.duration_seconds || null,
                shuffle_questions: templateFields.shuffle_questions || false,
                passing_score: templateFields.passing_score || null,
                user: { connect: { id: actorId } }
            };
            const newTemplate = await tx.exam_template.create({
                data: createData,
            });
        });
    },
    // Sửa template câu hỏi
    async updateExamTemplate(templateId, updateData) {
        return await prisma.$transaction(async (tx) => {
            // Lấy template hiện tại
            const existing = await tx.exam_template.findFirst({
                where: { id: templateId }
            });
            if (!existing) {
                const err = new Error("Template không tồn tại");
                err.status = 404;
                throw err;
            }
            // Chuẩn bị dữ liệu cập nhật
            const tUpdate = {};
            if (updateData.title !== undefined) tUpdate.title = updateData.title?.trim();
            if (updateData.description !== undefined) tUpdate.description = updateData.description ?? null;
            if (updateData.duration_seconds !== undefined) tUpdate.duration_seconds = updateData.duration_seconds || null;
            if (updateData.shuffle_questions !== undefined) tUpdate.shuffle_questions = updateData.shuffle_questions || false;
            if (updateData.passing_score !== undefined) tUpdate.passing_score = updateData.passing_score || null;
            // Cập nhật template
            const updatedTemplate = await tx.exam_template.update({
                where: { id: templateId },
                data: tUpdate,
            });
            return updatedTemplate;
                });
    },
    // Xóa template câu hỏi
    async deleteExamTemplate(templateId, actorId) {
        return await prisma.$transaction(async (tx) => {
            // Kiểm tra quyền sở hữu template
            const existing = await tx.exam_template.findFirst({
                where: { id: templateId}
            });
            if (!existing) {
                const err = new Error("Vui lòng nhập mã chính xác");
                err.status = 400;
                throw err;
            }
            if (existing.created_by !== actorId) {
                const err = new Error("Không có quyền xóa template này");
                err.status = 403;
                throw err;
            }
            // Xóa template
            await tx.exam_template.delete({
                where: { id: templateId }
            });
            return;
        });
    },
    // Lấy danh sách template đề thi theo giáo viên
    async getExamTemplate(teacherId) {
        if (!teacherId) {
            const err = new Error("Vui lòng nhập mã giáo viên");
            err.status = 400;
            throw err;
        }
        const templates = await prisma.exam_template.findMany({
            where: { created_by: teacherId },
            orderBy: { created_at: "desc" }
            });
        return templates;
    },

    // Đọc template cấu trúc 
    // async getExamTemplateById(templateId, actorId) {
    //     const template = await prisma.exam_template.findFirst({

    // const createData = {
    //             title: templateFields.title?.trim() ,
    //             description: templateFields.description ?? null,
    //             Renamedclass: { connect: { id: class_id } },
    //             duration_seconds: templateFields.duration_seconds || null,
    //             shuffle_questions: templateFields.shuffle_questions || false,
    //             passing_score: templateFields.passing_score || null,
    //             user: { connect: { id: actorId } }
    //         };

    //tạo instance đề thi
    async addExam_instance(instanceData, teacher_id) {
        const { questions = [], ... instanceFields} = instanceData;

        return await prisma.$transaction(async (tx) => {
            const createData = {
                starts_at: new Date(instanceFields.starts_at),
                ends_at: new Date(instanceFields.ends_at),
                template_id: instanceFields.templateId,
                // exam_template: {connect: { id: instanceFields.templateId } },
                published: instanceFields.published ?? false,
                created_by: teacher_id,
                created_at: new Date()
            }
            const newExamInstance = await tx.exam_instance.create({
                data: createData,
            });
            
            console.log("newExamInstance:", newExamInstance);

            if (Array.isArray(questions) && questions.length > 0) {
                const mapped = questions.map((q, i) => ({
                    exam_instance_id: newExamInstance.id,
                    question_id: q.question_id,
                    ordinal: q.ordinal ?? i,
                    points: q.points,
                }));
                await tx.exam_question.createMany({
                    data: mapped,
                    skipDuplicates: true,
                });
            }

            const result = await tx.exam_instance.findUnique({
                where: { id: newExamInstance.id },
                include: {
                    exam_question: {
                        orderBy: { ordinal: "asc" }
                    }
                }
            });
            return result;
        });
    }

};

