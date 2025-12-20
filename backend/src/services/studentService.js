const prisma = require("../prisma");
const userService = require("../services/userService");

module.exports =  {
    // Tham gia lớp học
    async joinClass(studentId, classCode, note) {
        // console.log(studentId, classCode);
        const classInfo = await prisma.Renamedclass.findFirst({
            where: { code: classCode },
        });
        if (!classInfo) {
            throw new Error("Lớp học không tồn tại");
        }
        // console.log(classInfo);
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
    async getEnrolledClasses(studentId) {
        const enrollments = await prisma.enrollment_request.findMany({
            where: { student_id: studentId, status: "approved" },
            include: { Renamedclass: true },
        });
        const classes = enrollments.map(enrollment => enrollment.Renamedclass);
        return classes;
    },   
    // Rời lớp học
    async leaveClass(studentId, classId) {
        await prisma.enrollment_request.deleteMany({
            where: { student_id: studentId, class_id: classId, status: "approved" },
        });
        return;
    },

    // lấy danh sách đề thi của sinh viên theo lớp học
    async getExamsByClass(studentId, classId) {
        const enrollments = await prisma.enrollment_request.findFirst({
            where: { student_id: studentId, class_id: classId, status: "approved" },
        });
        if (!enrollments) {
            throw new Error("Sinh viên không tham gia lớp học này");
        }   
        const exams = await prisma.exam_instance.findMany({
            where: { 
                published: true,
                exam_template: {
                    class_id: classId,
                },
            },
            select: {
                id: true,
                starts_at: true,
                ends_at: true,
                exam_template: {
                    select: {
                        title: true,
                        duration_seconds: true,
                        passing_score: true,
                    },
                },
            },
        });

        const now = new Date();
        const examsWithStatus = exams.map(exam => {
            let status;

            if (now < exam.starts_at) {
                status = "upcoming";
            } else if (now > exam.ends_at) {
                status = "ended";
            } else {
                status = "ongoing";
            }

            return {
                id: exam.id,
                title: exam.exam_template.title,
                starts_at: exam.starts_at,
                ends_at: exam.ends_at,
                duration: exam.exam_template.duration_seconds,
                passing_score: exam.exam_template.passing_score,
                status,
            };
        });
        
        return examsWithStatus;
    }
};