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
    }   
};