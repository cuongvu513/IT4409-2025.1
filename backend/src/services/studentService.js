const prisma = require("../prisma");
const userService = require("../services/userService");

module.exports = {
    // Tham gia lớp học
    async joinClass(studentId, classCode, note) {
        const classInfo = await prisma.Renamedclass.findFirst({
            where: { code: classCode },
        });
        if (!classInfo) {
            throw new Error("Lớp học không tồn tại");
        }

        const existingRequest = await prisma.enrollment_request.findFirst({
            where: { student_id: studentId, class_id: classInfo.id },
        });
        if (existingRequest) {
            throw new Error("Bạn đã gửi yêu cầu tham gia lớp học này");
        }

        const newRequest = await prisma.enrollment_request.create({
            data: {
                student_id: studentId,
                class_id: classInfo.id,
                status: "pending",
                note: note || null,
            },
        });
        return newRequest;
    },

    // Lấy danh sách lớp học đã tham gia
    async getEnrolledClasses(studentId, status) {
        if (status !== "pending" && status !== "approved") {
            const err =  new Error("Trạng thái không hợp lệ");
            err.status = 400;
            throw err;
        }
        const enrollments = await prisma.enrollment_request.findMany({
            where: { student_id: studentId, status: status },
            include: { Renamedclass: true },
        });
        const classes = enrollments.map((enrollment) => enrollment.Renamedclass);
        return classes;
    },

    // Rời lớp học
    async leaveClass(studentId, classId) {
        await prisma.enrollment_request.deleteMany({
            where: { student_id: studentId, class_id: classId, status: "approved" },
        });
        return;
    },

    // Lấy danh sách đề thi đã publish của lớp học mà sinh viên đã được duyệt
    async getStudentExams(studentId, classId) {
        const enrollment = await prisma.enrollment_request.findFirst({
            where: {
                student_id: studentId,
                class_id: classId,
                status: "approved",
            },
        });
        if (!enrollment) {
            const err = new Error("Bạn chưa tham gia lớp này hoặc chưa được duyệt");
            err.status = 403;
            throw err;
        }

        const exams = await prisma.exam_instance.findMany({
            where: {
                published: true,
                exam_template: {
                    class_id: classId,
                },
            },
            include: {
                exam_template: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        duration_seconds: true,
                        class_id: true,
                    },
                },
            },
            orderBy: { starts_at: "asc" },
        });

        return exams;
    },
};