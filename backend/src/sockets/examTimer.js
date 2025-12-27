const jwt = require("jsonwebtoken");
const prisma = require("../prisma");
const JWT_SECRET = process.env.JWT_SECRET || "Password123!!!";

/**
 * Xác thực socket bằng JWT token
 */
function authenticateSocket(socket, next) {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      return next(new Error("Không có token xác thực"));
    }

    const payload = jwt.verify(token, JWT_SECRET);
    socket.userId = payload.id;
    socket.userRole = payload.role;
    next();
  } catch (err) {
    next(new Error("Token không hợp lệ"));
  }
}

/**
 * Tính thời gian còn lại của exam session (tính bằng giây)
 */
function calculateRemainingTime(examSession) {
  if (!examSession.started_at || !examSession.ends_at) {
    return null;
  }

  const now = new Date();
  const endsAt = new Date(examSession.ends_at);
  const remainingMs = endsAt.getTime() - now.getTime();
  
  // Trả về số giây còn lại, tối thiểu là 0
  return Math.max(0, Math.floor(remainingMs / 1000));
}

/**
 * Lấy thông tin exam session của học sinh
 */
async function getExamSession(userId, examInstanceId) {
  // Kiểm tra xem có exam session nào không
  const anySession = await prisma.exam_session.findFirst({
    where: {
      user_id: userId,
      exam_instance_id: examInstanceId,
    },
    select: {
      id: true,
      state: true
    }
  });

  if (!anySession) {
    // Kiểm tra xem exam_instance có tồn tại và học sinh có quyền tham gia không
    const examInstance = await prisma.exam_instance.findUnique({
      where: { id: examInstanceId },
      include: {
        exam_template: {
          include: {
            Renamedclass: {
              select: { id: true }
            }
          }
        }
      }
    });

    if (!examInstance) {
      return { error: "EXAM_NOT_FOUND", message: "Kỳ thi không tồn tại" };
    }

    // Kiểm tra enrollment
    const enrollment = await prisma.enrollment_request.findFirst({
      where: {
        student_id: userId,
        class_id: examInstance.exam_template.Renamedclass.id,
        status: "approved"
      }
    });

    if (!enrollment) {
      return { error: "NOT_ENROLLED", message: "Bạn chưa tham gia lớp học này" };
    }

    // Trả về trạng thái chờ - chưa bắt đầu làm bài
    return { 
      error: "NOT_STARTED", 
      message: "Bạn chưa bắt đầu làm bài thi này. Vui lòng nhấn 'Bắt đầu làm bài' để tiếp tục.",
      canStart: true
    };
  }

  if (!["started", "pending"].includes(anySession.state)) {
    return { 
      error: "INVALID_STATE", 
      message: `Phiên thi đang ở trạng thái: ${anySession.state}`,
      currentState: anySession.state
    };
  }

  const examSession = await prisma.exam_session.findFirst({
    where: {
      user_id: userId,
      exam_instance_id: examInstanceId,
      state: { in: ["started", "pending"] }
    },
    include: {
      exam_instance: {
        select: {
          template_id: true,
          starts_at: true,
          ends_at: true,
        }
      }
    }
  });

  return examSession;
}

/**
 * Lấy thông tin tất cả exam sessions đang hoạt động của học sinh
 */
async function getActiveExamSessions(userId) {
  const examSessions = await prisma.exam_session.findMany({
    where: {
      user_id: userId,
      state: { in: ["started"] }
    },
    include: {
      exam_instance: {
        select: {
          id: true,
          template_id: true,
          starts_at: true,
          ends_at: true,
        }
      }
    }
  });

  return examSessions;
}

/**
 * Khởi tạo WebSocket cho exam timer
 */
function initExamTimerSocket(io) {
  const examNamespace = io.of("/exam-timer");
  
  // Map để theo dõi intervals của từng socket
  const timerIntervals = new Map();

  examNamespace.use(authenticateSocket);

  examNamespace.on("connection", (socket) => {
    console.log(`[ExamTimer] User ${socket.userId} connected`);

    // Lắng nghe sự kiện subscribe đến một exam cụ thể
    socket.on("subscribe", async ({ examInstanceId }) => {
      try {
        console.log(`[ExamTimer] Subscribe request - User: ${socket.userId}, Exam: ${examInstanceId}`);
        
        const examSession = await getExamSession(socket.userId, examInstanceId);
        
        // Kiểm tra lỗi chi tiết
        if (!examSession || examSession.error) {
          const errorInfo = examSession || {};
          console.log(`[ExamTimer] Subscribe failed - ${errorInfo.error || 'NO_SESSION'}: ${errorInfo.message || 'Không tìm thấy phiên thi'}`);
          
          // Nếu là trường hợp chưa bắt đầu làm bài (NOT_STARTED), cho phép subscribe
          if (errorInfo.error === "NOT_STARTED") {
            const roomName = `exam-${examInstanceId}`;
            socket.join(roomName);
            
            socket.emit("waiting", {
              code: "NOT_STARTED",
              message: errorInfo.message,
              examInstanceId: examInstanceId,
              canStart: true
            });
            
            console.log(`[ExamTimer] User ${socket.userId} subscribed to ${roomName} (waiting to start)`);
            return;
          }
          
          // Các lỗi khác
          socket.emit("error", { 
            code: errorInfo.error || "NO_SESSION",
            message: errorInfo.message || "Không tìm thấy phiên thi hoặc phiên thi đã kết thúc",
            currentState: errorInfo.currentState
          });
          return;
        }

        // Join room theo examInstanceId
        const roomName = `exam-${examInstanceId}`;
        socket.join(roomName);

        console.log(`[ExamTimer] User ${socket.userId} subscribed to ${roomName}`);

        // Gửi thời gian còn lại ngay lập tức
        const remainingTime = calculateRemainingTime(examSession);
        socket.emit("time-update", {
          examInstanceId,
          examSessionId: examSession.id,
          remainingSeconds: remainingTime,
          state: examSession.state,
          started_at: examSession.started_at,
          ends_at: examSession.ends_at
        });

        // Nếu chưa có interval cho socket này, tạo mới
        if (!timerIntervals.has(socket.id)) {
          const intervalId = setInterval(async () => {
            try {
              // Lấy lại thông tin exam session để đảm bảo dữ liệu mới nhất
              const updatedSession = await getExamSession(socket.userId, examInstanceId);
              
              if (!updatedSession || updatedSession.state === "submitted") {
                // Nếu session không còn hoặc đã submit, dừng timer
                socket.emit("exam-ended", {
                  examInstanceId,
                  examSessionId: updatedSession?.id,
                  state: updatedSession?.state
                });
                
                clearInterval(intervalId);
                timerIntervals.delete(socket.id);
                return;
              }

              const remainingTime = calculateRemainingTime(updatedSession);
              
              socket.emit("time-update", {
                examInstanceId,
                examSessionId: updatedSession.id,
                remainingSeconds: remainingTime,
                state: updatedSession.state,
                started_at: updatedSession.started_at,
                ends_at: updatedSession.ends_at
              });

              // Nếu hết thời gian, thông báo và dừng timer
              if (remainingTime === 0) {
                socket.emit("time-expired", {
                  examInstanceId,
                  examSessionId: updatedSession.id
                });
                
                clearInterval(intervalId);
                timerIntervals.delete(socket.id);
              }
            } catch (error) {
              console.error(`[ExamTimer] Error in interval for socket ${socket.id}:`, error);
            }
          }, 1000); // Cập nhật mỗi giây

          timerIntervals.set(socket.id, intervalId);
        }
      } catch (error) {
        console.error("[ExamTimer] Subscribe error:", error);
        socket.emit("error", { message: "Lỗi khi đăng ký nhận thời gian thi" });
      }
    });

    // Lắng nghe sự kiện unsubscribe
    socket.on("unsubscribe", ({ examInstanceId }) => {
      const roomName = `exam-${examInstanceId}`;
      socket.leave(roomName);
      console.log(`[ExamTimer] User ${socket.userId} unsubscribed from ${roomName}`);
    });

    // Lấy danh sách tất cả exam sessions đang active
    socket.on("get-active-sessions", async () => {
      try {
        const sessions = await getActiveExamSessions(socket.userId);
        const sessionsWithTime = sessions.map(session => ({
          examInstanceId: session.exam_instance_id,
          examSessionId: session.id,
          remainingSeconds: calculateRemainingTime(session),
          state: session.state,
          started_at: session.started_at,
          ends_at: session.ends_at
        }));

        socket.emit("active-sessions", { sessions: sessionsWithTime });
      } catch (error) {
        console.error("[ExamTimer] Get active sessions error:", error);
        socket.emit("error", { message: "Lỗi khi lấy danh sách phiên thi" });
      }
    });

    // Xử lý khi socket disconnect
    socket.on("disconnect", () => {
      console.log(`[ExamTimer] User ${socket.userId} disconnected`);
      
      // Xóa interval nếu có
      if (timerIntervals.has(socket.id)) {
        clearInterval(timerIntervals.get(socket.id));
        timerIntervals.delete(socket.id);
      }
    });
  });

  return examNamespace;
}

/**
 * Broadcast cập nhật thời gian cho một exam instance cụ thể
 * Sử dụng khi giáo viên cập nhật thời gian exam
 */
async function broadcastTimeUpdate(io, examInstanceId, userId = null) {
  const examNamespace = io.of("/exam-timer");
  const roomName = `exam-${examInstanceId}`;
  
  console.log(`[ExamTimer] Broadcasting time update for exam ${examInstanceId}`);
  
  // Nếu có userId cụ thể, chỉ cập nhật cho user đó
  if (userId) {
    const examSession = await getExamSession(userId, examInstanceId);
    
    if (examSession && !examSession.error) {
      const remainingTime = calculateRemainingTime(examSession);
      
      // Emit cho tất cả sockets của user này trong room
      examNamespace.to(roomName).emit("time-force-update", {
        examInstanceId,
        examSessionId: examSession.id,
        remainingSeconds: remainingTime,
        state: examSession.state,
        started_at: examSession.started_at,
        ends_at: examSession.ends_at,
        message: "Giáo viên đã cập nhật thời gian làm bài"
      });
    }
  } else {
    // Broadcast cho tất cả users trong room
    examNamespace.to(roomName).emit("time-force-update", {
      examInstanceId,
      message: "Thời gian thi đã được cập nhật, vui lòng làm mới"
    });
  }
}

module.exports = { initExamTimerSocket, broadcastTimeUpdate };
