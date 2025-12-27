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
        if (status !== "approved" && status !== "rejected") {
            const err = new Error("Trạng thái không hợp lệ");
            err.status = 400;
            throw err;
        }
        if (status === "approved") {
        const request = await prisma.enrollment_request.updateMany({
            where: { id: requestId },
            data: { status: status },
        });
        return request;
        } else {
            await prisma.enrollment_request.deleteMany({
                where: { id: requestId },
            });
        }
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
    // lấy template đề thi theo keyword
    async searchExamTemplates(teacherId, keyword) {
        if (!keyword || keyword.trim() === "") {
            return [];
        }   
        const templates = await prisma.exam_template.findMany({
            where: {
                created_by: teacherId,
                title: {
                    contains: keyword,
                    mode: "insensitive"
                }
            },  
            orderBy: { created_at: "desc" }
        });
        return templates;
    },  
    // lấy template theo id 
    async getExamTemplateById(teacherId,templateId){
        const template = await prisma.exam_template.findFirst({
            where: { id: templateId, created_by: teacherId },
        });
        if(!template){
            const err = new Error("Template đề thi không tồn tại hoăc không có quyền truy cập");
            err.status = 400;
            throw err;
        }
        return template;
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
                show_answers: instanceFields.show_answers ?? false,
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
    },

    // xóa instance đề thi
    async deleteExam_instance(instanceId, teacherId) {
        return await prisma.$transaction(async (tx) => {
            // Kiểm tra quyền sở hữu 
            const instance = await tx.exam_instance.findFirst({
                where: {
                    id: instanceId,
                    created_by: teacherId
                }
            });
            if (!instance) {
                throw new Error("Không tìm thấy instance đề thi hoặc không có quyền xóa");
            }
            // XÓA liên kết đề thi - câu hỏi
            await tx.exam_question.deleteMany({
                where: { exam_instance_id: instanceId }
            }); 
            // Xóa instance đề thi
            await tx.exam_instance.delete({
                where: { id: instanceId }
            });
            return true;
        });
    },

    // Lấy danh sách instance đề thi theo template  
    async getExamInstancesByTemplate(templateId, teacherId) {  
        const template = await prisma.exam_template.findFirst({
            where: { id: templateId, created_by: teacherId },
        });
        if (!template) {
            const err = new Error("Template đề thi không tồn tại hoăc không có quyền truy cập");
            err.status = 404;
            throw err;
        }
        const instances = await prisma.exam_instance.findMany({
            where: { template_id: templateId },
            orderBy: { created_at: "desc" }
        });
        return instances;
    },

    // chinh sua instance de thi
    async updateExamInstance(instanceId, teacher_id, updateData) {
        return await prisma.$transaction(async (tx) => {
            // Lấy instance hiện tại và kiểm tra quyền
            const instance = await tx.exam_instance.findFirst({
                where: { id: instanceId, created_by: teacher_id },
            });
            if (!instance) {
                const err = new Error("Instance đề thi không tồn tại hoặc không có quyền sửa");
                err.status = 404;
                throw err;
            }

            // kiểm tra dữ liệu thời gian trước khi cập nhập
            if (updateData.starts_at && updateData.ends_at) {
                const startDate = new Date(updateData.starts_at);
                const endDate = new Date(updateData.ends_at);
                if (startDate >= endDate) {
                    const err = new Error("Thời gian kết thúc phải sau thời gian bắt đầu");
                    err.status = 400;
                    throw err;
                }
                if (startDate <= new Date()) {
                    const err = new Error("Thời gian bắt đầu phải là tương lai");
                    err.status = 400;
                    throw err;
                }
            }
            else if (updateData.starts_at) {
                const startDate = new Date(updateData.starts_at);
                const endDate = instance.ends_at;   
                if (startDate >= endDate) {
                    const err = new Error("Thời gian bắt đầu mới phải trước thời gian kết thúc cũ");
                    err.status = 400;
                    throw err;
                }
                if (startDate <= new Date()) {
                    const err = new Error("Thời gian bắt đầu phải là tương lai");
                    err.status = 400;
                    throw err;
                }
            }
            else if (updateData.ends_at) {
                const startDate = instance.starts_at;
                const endDate = new Date(updateData.ends_at);
                if (startDate >= endDate) {
                    const err = new Error("Thời gian kết thúc mới phải sau thời gian bắt đầu cũ");
                    err.status = 400;
                    throw err;
                }
            }

            // Chuẩn bị dữ liệu cập nhật
            const iUpdate = {};
            if (updateData.starts_at !== undefined) iUpdate.starts_at = new Date(updateData.starts_at);
            if (updateData.ends_at !== undefined) iUpdate.ends_at = new Date(updateData.ends_at);
            if (updateData.published !== undefined) iUpdate.published = updateData.published;
            // Cập nhật instance
            const updatedInstance = await tx.exam_instance.update({
                where: { id: instanceId },
                data: iUpdate,
            });

            // xóa hết câu hỏi cũ
            await tx.exam_question.deleteMany({
                where: { exam_instance_id: instanceId }
            });
            // thêm câu hỏi mới
            const { questions = [] } = updateData;
            if (Array.isArray(questions) && questions.length > 0) {
                const mapped = questions.map((q, i) => ({
                    exam_instance_id: instanceId,
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
                where: { id: updatedInstance.id },
                include: {
                    exam_question: {
                        orderBy: { ordinal: "asc" }
                    }
                }
            });
            return result;
        });
    },

    // lấy chi tiết instance đề thi theo ID
    async getExamInstanceById(instanceId, teacherId) {
        const instance = await prisma.exam_instance.findFirst({
            where: { id: instanceId, created_by: teacherId },
            include: {
                exam_question: {
                    orderBy: { ordinal: "asc" }
                }
            }
        });
        return instance;
    },

    // tìm kiếm sinh viên theo tên hoặc email trong lớp học
    async searchStudentsInClass(teacherId, classId, keyword) {
        if (!keyword || keyword.trim() === "") {
            return [];
        }

        const students = await prisma.enrollment_request.findMany({
            where: {
                class_id: classId,
                status: "approved",
                Renamedclass: {
                    teacher_id: teacherId
                },
                user_enrollment_request_student_idTouser: {
                    name: {
                        contains: keyword,
                        mode: "insensitive"
                    }
                }
            },
            select: {
                user_enrollment_request_student_idTouser: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        return students.map(s => s.user_enrollment_request_student_idTouser);
    },

    // công bố đề thi
    async publishExamInstance(instanceId, teacherId) {
        const updatedInstance = await prisma.exam_instance.updateMany({
            where: { id: instanceId, created_by: teacherId },
            data: { published: true },
        });
        return updatedInstance;
    },

    // hủy công bố đề thi
    async unpublishExamInstance(instanceId, teacherId) {
        const updatedInstance = await prisma.exam_instance.updateMany({
            where: { id: instanceId, created_by: teacherId },
            data: { published: false },
        });
        return updatedInstance;
    },

    // Danh sách flag của học sinh trong 1 kỳ thi
    async listFlaggedSessionsByClass(exam_instance_id) {
        const flags = await prisma.session_flag.findMany({
            where: {
                exam_session: {
                    exam_instance: exam_instance_id,
                },
            },
            include: {
                exam_session: {
                    select: {
                        id: true,
                        user: { select: { id: true, name: true, email: true } },
                        exam_instance: {
                            select: {
                                id: true,
                                exam_template: {
                                    select: { id: true, title: true, class_id: true },
                                },
                            },
                        },
                    },
                },
                user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { created_at: "desc" },
        });

        return flags.map((f) => ({
            id: f.id,
            flag_type: f.flag_type,
            details: f.details,
            created_at: f.created_at,
            session_id: f.exam_session?.id,
            exam_instance_id: f.exam_session?.exam_instance?.id,
            exam_template: f.exam_session?.exam_instance?.exam_template,
            student: f.exam_session?.user,
            flagged_by: f.user,
        }));
    },

    // Khóa thủ công một phiên thi
    async lockExamSession(sessionId, teacherId, reason) {
        const session = await prisma.exam_session.findFirst({
            where: {
                id: sessionId,
                exam_instance: {
                    exam_template: {
                        Renamedclass: { teacher_id: teacherId },
                    },
                },
            },
            include: {
                exam_instance: { select: { id: true, ends_at: true } },
            },
        });

        if (!session) {
            const err = new Error("Phiên thi không tồn tại hoặc không thuộc lớp của bạn");
            err.status = 404;
            throw err;
        }

        if (session.state === "submitted" || session.state === "expired") {
            const err = new Error("Không thể khóa phiên đã nộp hoặc đã hết hạn");
            err.status = 400;
            throw err;
        }

        await prisma.exam_session.update({
            where: { id: sessionId },
            data: { state: "locked", updated_at: new Date() },
        });

        await prisma.session_flag.create({
            data: {
                exam_session_id: sessionId,
                flag_type: "manual_lock",
                details: { reason: reason || "Giáo viên khóa thủ công" },
                flagged_by: teacherId,
            },
        });

        return { sessionId, state: "locked" };
    },

    // Mở khóa thủ công một phiên thi
    async unlockExamSession(sessionId, teacherId, reason) {
        const session = await prisma.exam_session.findFirst({
            where: {
                id: sessionId,
                exam_instance: {
                    exam_template: {
                        Renamedclass: { teacher_id: teacherId },
                    },
                },
            },
            include: {
                exam_instance: { select: { ends_at: true } },
            },
        });

        if (!session) {
            const err = new Error("Phiên thi không tồn tại hoặc không thuộc lớp của bạn");
            err.status = 404;
            throw err;
        }

        if (session.state !== "locked") {
            const err = new Error("Chỉ mở khóa được phiên đang ở trạng thái locked");
            err.status = 400;
            throw err;
        }

        const now = new Date();
        if (session.exam_instance?.ends_at && now > session.exam_instance.ends_at) {
            const err = new Error("Phiên thi đã hết hạn, không thể mở khóa");
            err.status = 400;
            throw err;
        }

        await prisma.exam_session.update({
            where: { id: sessionId },
            data: { state: "started", updated_at: new Date() },
        });

        await prisma.session_flag.create({
            data: {
                exam_session_id: sessionId,
                flag_type: "manual_unlock",
                details: { reason: reason || "Giáo viên mở khóa thủ công" },
                flagged_by: teacherId,
            },
        });

        return { sessionId, state: "started" };
    },

    // Thêm thời gian cộng thêm cho một học sinh trong đề thi
    async upsertAccommodation({ teacherId, examInstanceId, studentId, extraSeconds, addSeconds, notes }) {
        // 1) Kiểm tra quyền sở hữu đề thi
        const instance = await prisma.exam_instance.findFirst({
            where: { id: examInstanceId, created_by: teacherId },
            include: { exam_template: true },
        });
        if (!instance) {
            const err = new Error("Đề thi không tồn tại hoặc bạn không có quyền");
            err.status = 403;
            throw err;
        }

        // 2) Kiểm tra học sinh thuộc lớp (và đã được duyệt)
        const enrollment = await prisma.enrollment_request.findFirst({
            where: {
                student_id: studentId,
                class_id: instance.exam_template.class_id,
                status: "approved",
            },
        });
        if (!enrollment) {
            const err = new Error("Học sinh không thuộc lớp của đề thi hoặc chưa được duyệt");
            err.status = 400;
            throw err;
        }

        // 3) Tính tổng thời gian cộng thêm: hỗ trợ chế độ cộng dồn (addSeconds) hoặc đặt tuyệt đối (extraSeconds)
        const existingAcc = await prisma.accommodation.findFirst({
            where: { user_id: studentId, exam_instance_id: examInstanceId },
        });
        const currentExtra = existingAcc?.extra_seconds || 0;
        const finalExtra = (typeof addSeconds === "number")
            ? currentExtra + addSeconds
            : (typeof extraSeconds === "number" ? extraSeconds : currentExtra);

        const accommodation = await prisma.accommodation.upsert({
            where: {
                user_id_exam_instance_id: {
                    user_id: studentId,
                    exam_instance_id: examInstanceId,
                },
            },
            update: {
                extra_seconds: finalExtra,
                notes: notes ?? existingAcc?.notes ?? null,
            },
            create: {
                user_id: studentId,
                exam_instance_id: examInstanceId,
                extra_seconds: finalExtra,
                notes: notes ?? null,
            },
        });

        // 4) Nếu học sinh đã có phiên thi đang diễn ra, kéo dài thời gian (không vượt quá ends_at của đề thi)
        const session = await prisma.exam_session.findFirst({
            where: {
                exam_instance_id: examInstanceId,
                user_id: studentId,
                state: "started",
            },
        });

        if (session && session.started_at) {
            const baseDuration = instance.exam_template.duration_seconds;
            const newDuration = baseDuration + accommodation.extra_seconds;
            const hardEnd = new Date(instance.ends_at);
            const softEnd = new Date(new Date(session.started_at).getTime() + newDuration * 1000);
            const newEndsAt = new Date(Math.min(hardEnd.getTime(), softEnd.getTime()));
            console.log({ hardEnd, softEnd, newEndsAt });
            if (!session.ends_at || newEndsAt > session.ends_at) {
                await prisma.exam_session.update({
                    where: { id: session.id },
                    data: { ends_at: newEndsAt },
                });
            }
        }

        return accommodation;
    },

    // Liệt kê học sinh đang thi (có exam_session state='started') trong một lớp
    async listActiveStudentsInClass(teacherId, classId) {
        // 1) Kiểm tra lớp thuộc giáo viên
        const klass = await prisma.Renamedclass.findFirst({
            where: { id: classId, teacher_id: teacherId },
            select: { id: true }
        });
        if (!klass) {
            const err = new Error("Lớp học không tồn tại hoặc bạn không có quyền");
            err.status = 403;
            throw err;
        }

        // 2) Tìm các phiên thi đang diễn ra thuộc các exam_instance của lớp này
        const sessions = await prisma.exam_session.findMany({
            where: {
                state: "started",
                exam_instance: {
                    exam_template: {
                        class_id: classId,
                    },
                },
            },
            select: {
                user: { select: { id: true, name: true } },
                user_id: true,
            },
        });

        // 3) Unique theo user_id và trả về danh sách id/name
        const seen = new Set();
        const result = [];
        for (const s of sessions) {
            if (!seen.has(s.user_id)) {
                seen.add(s.user_id);
                result.push({ id: s.user.id, name: s.user.name });
            }
        }
        return result;
    },

    // Lấy tất cả exam_instance của 1 lớp học
    async getExamInstancesByClass(teacherId, classId) {
        // 1) Kiểm tra quyền lớp học
        const klass = await prisma.Renamedclass.findFirst({
            where: {
                id: classId,
                teacher_id: teacherId
            },
            select: { id: true }
        });

        if (!klass) {
            const err = new Error("Lớp học không tồn tại hoặc bạn không có quyền");
            err.status = 403;
            throw err;
        }

        // 2) Lấy exam_instance thông qua exam_template
        const instances = await prisma.exam_instance.findMany({
            where: {
                exam_template: {
                    class_id: classId
                }
            },
            orderBy: {
                created_at: "desc"
            }
        });

        return instances;
    },

    // Lấy tiến độ làm bài thi của sinh viên trong lớp
    async getExamProgressByClass(teacherId, classId, examInstanceId) {

        // 1️ Check quyền giáo viên
        const klass = await prisma.Renamedclass.findFirst({
            where: {
                id: classId,
                teacher_id: teacherId
            },
            select: { id: true }
        });

        if (!klass) {
            const err = new Error("Lớp học không tồn tại hoặc bạn không có quyền");
            err.status = 403;
            throw err;
        }

        // 2️ Lấy sinh viên đã được duyệt
        const enrollments = await prisma.enrollment_request.findMany({
            where: {
                class_id: classId,
                status: "approved"
            },
            select: {
                user_enrollment_request_student_idTouser: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        const students = enrollments
            .map(e => e.user_enrollment_request_student_idTouser)
            .filter(Boolean); // loại null / undefined

        // 3️ Lấy session của ca thi
        const sessions = await prisma.exam_session.findMany({
            where: {
                exam_instance_id: examInstanceId
            },
            select: {
                id: true,
                user_id: true,
                state: true,
                started_at: true,
                ends_at: true
            }
        });


        // 4️ Map session theo user_id
        const sessionMap = new Map();
        for (const s of sessions) {
            sessionMap.set(s.user_id, s);
        }

        // 5️ Phân loại tiến độ
        const result = {
            not_started: [],
            in_progress: [],
            finished: []
        };

        const now = new Date();

        for (const user of students) {
            const session = sessionMap.get(user.id);

            // 5.1 Chưa vào phòng thi
            if (!session || session.state === "pending") {
                result.not_started.push(user);
                continue;
            }

            // 5.2 Đang làm bài (started + còn thời gian)
            if (
                session.state === "started" &&
                (!session.ends_at || now <= session.ends_at)
            ) {
                result.in_progress.push({
                    ...user,
                    state: session.state,
                    started_at: session.started_at,
                    ends_at: session.ends_at
                });
                continue;
            }

            // 5.3 Đã kết thúc (submitted / expired / locked / started nhưng hết giờ)
            result.finished.push({
                ...user,
                state: session.state,
                started_at: session.started_at,
                ends_at: session.ends_at
            });
        }

        return result;
    },

    // Lấy thông tin dashboard của giáo viên (số lớp, học sinh, đề thi, hoạt động)
    async getDashboardStats(teacherId) {
        //  Lấy số lớp học
        const classCount = await prisma.Renamedclass.count({
            where: { teacher_id: teacherId }
        });

        //  Lấy tổng số học sinh từ các lớp của giáo viên
        const totalStudents = await prisma.enrollment_request.count({
            where: {
                status: "approved",
                Renamedclass: { teacher_id: teacherId }
            }
        });

        //  Lấy số đề thi đã tạo
        const examInstanceCount = await prisma.exam_instance.count({
            where: { created_by: teacherId }
        });

        // Lấy hoạt động gần đây (từ các action khác nhau)
        const [recentClasses, recentEnrollments, recentExams, recentQuestions, recentTemplates] = await Promise.all([
            // Lớp học được tạo
            prisma.Renamedclass.findMany({
                where: { teacher_id: teacherId },
                select: { id: true, name: true, created_at: true },
                orderBy: { created_at: "desc" },
                take: 10
            }),
            // Học sinh tham gia được duyệt
            prisma.enrollment_request.findMany({
                where: {
                    Renamedclass: { teacher_id: teacherId },
                    status: "approved"
                },
                select: {
                    id: true,
                    requested_at: true,
                    user_enrollment_request_student_idTouser: {
                        select: { name: true }
                    },
                    Renamedclass: { select: { name: true } }
                },
                orderBy: { requested_at: "desc" },
                take: 10
            }),
            // Đề thi được tạo
            prisma.exam_instance.findMany({
                where: { created_by: teacherId },
                select: {
                    id: true,
                    created_at: true,
                    exam_template: { select: { title: true } }
                },
                orderBy: { created_at: "desc" },
                take: 10
            }),
            // Câu hỏi được tạo
            prisma.question.findMany({
                where: { owner_id: teacherId },
                select: {
                    id: true,
                    text: true,
                    created_at: true
                },
                orderBy: { created_at: "desc" },
                take: 10
            }),
            // Template được tạo
            prisma.exam_template.findMany({
                where: { created_by: teacherId },
                select: {
                    id: true,
                    title: true,
                    created_at: true
                },
                orderBy: { created_at: "desc" },
                take: 10
            })
        ]);

        // Kết hợp tất cả hoạt động thành một danh sách duy nhất, sắp xếp theo thời gian
        const activities = [
            ...recentClasses.map(c => ({
                id: c.id,
                type: "create_class",
                description: `Tạo lớp học "${c.name}"`,
                timestamp: c.created_at
            })),
            ...recentEnrollments.map(e => ({
                id: e.id,
                type: "approve_enrollment",
                description: `Duyệt học sinh "${e.user_enrollment_request_student_idTouser.name}" vào lớp "${e.Renamedclass.name}"`,
                timestamp: e.updated_at
            })),
            ...recentExams.map(ex => ({
                id: ex.id,
                type: "create_exam_instance",
                description: `Tạo đề thi "${ex.exam_template.title}"`,
                timestamp: ex.created_at
            })),
            ...recentQuestions.map(q => ({
                id: q.id,
                type: "create_question",
                description: `Thêm câu hỏi: "${q.text.substring(0, 50)}..."`,
                timestamp: q.created_at
            })),
            ...recentTemplates.map(t => ({
                id: t.id,
                type: "create_template",
                description: `Tạo template đề thi "${t.title}"`,
                timestamp: t.created_at
            }))
        ];

        // Sắp xếp theo thời gian mới nhất
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Lấy 20 hoạt động gần nhất
        const recentActivities = activities.slice(0, 20);

        return {
            stats: {
                totalClasses: classCount,
                totalStudents,
                totalExams: examInstanceCount,
                totalQuestions: await prisma.question.count({ where: { owner_id: teacherId } }),
                totalTemplates: await prisma.exam_template.count({ where: { created_by: teacherId } })
            },
            recentActivities
        };
    },

    // // thông báo thông tin cho sinh viên
    // async notifyStudentsInClass(teacherId, classId, notificationData) {
    //     // 1) Kiểm tra quyền lớp học
    //     const klass = await prisma.Renamedclass.findFirst({
    //         where: {
    //             id: classId,
    //             teacher_id: teacherId
    //         },
    //         select: { id: true }
    //     });
    //     if (!klass) {
    //         const err = new Error("Lớp học không tồn tại hoặc bạn không có quyền");
    //         err.status = 403;
    //         throw err;
    //     }
    //     // 2) Lấy danh sách học sinh đã được duyệt trong lớp
    //     const students = await prisma.enrollment_request.findMany({
    //         where: {
    //             class_id: classId,
    //             status: "approved"
    //         },
    //         select: {
    //             user_enrollment_request_student_idTouser: {
    //                 select: { id: true, name: true, email: true }
    //             }
    //         }
    //     });
    //     // 3) Gửi thông báo (giả sử có hàm sendNotification)
    //     const notifications = [];
    //     for (const s of students) {
    //         const user = s.user_enrollment_request_student_idTouser;
    //         const notification = await sendNotification(user.id, notificationData);
    //         notifications.push(notification);
    //     }
    //     return notifications;
    // }

};

