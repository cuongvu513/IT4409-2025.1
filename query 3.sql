-- 1. Đăng nhập người dùng (kiểm tra email + mật khẩu)
SELECT UserID, FullName, Role 
FROM Users 
WHERE Email = ? AND PasswordHash = ?;

-- 2. Lấy danh sách tất cả môn học
SELECT SubjectID, SubjectName, Description 
FROM Subjects 
ORDER BY SubjectName;

-- 3. Lấy danh sách bài thi đang mở (chưa làm) của một sinh viên
-- Thay :user_id bằng ID sinh viên đang đăng nhập
SELECT 
    e.ExamID, 
    e.Title, 
    s.SubjectName, 
    e.Duration, 
    e.StartTime, 
    e.EndTime,
    u.FullName AS TeacherName
FROM Exams e
JOIN Subjects s ON e.SubjectID = s.SubjectID
JOIN Users u ON e.CreatedBy = u.UserID
WHERE NOW() BETWEEN e.StartTime AND e.EndTime
  AND e.ExamID NOT IN (
      SELECT ExamID FROM UserExams WHERE UserID = :user_id AND EndTime IS NOT NULL
  )
ORDER BY e.StartTime DESC;

-- 4. Lấy thông tin chi tiết một bài thi
SELECT 
    e.Title, 
    e.Duration, 
    e.StartTime, 
    e.EndTime, 
    s.SubjectName,
    u.FullName AS TeacherName
FROM Exams e
JOIN Subjects s ON e.SubjectID = s.SubjectID
JOIN Users u ON e.CreatedBy = u.UserID
WHERE e.ExamID = :exam_id;

-- 5. Lấy toàn bộ câu hỏi + đáp án của bài thi (dùng khi sinh viên làm bài)
SELECT 
    q.QuestionID,
    q.Content,
    q.QuestionType,   -- Single, Multiple, Fill
    q.Level,          -- hệ số điểm
    a.AnswerID,
    a.AnswerText,
    a.IsCorrect
FROM ExamQuestions eq
JOIN Questions q ON eq.QuestionID = q.QuestionID
LEFT JOIN Answers a ON q.QuestionID = a.QuestionID
WHERE eq.ExamID = :exam_id
ORDER BY q.QuestionID, a.AnswerID;

-- 6. Bắt đầu làm bài – tạo bản ghi trong UserExams
INSERT INTO UserExams (ExamID, UserID, StartTime)
VALUES (:exam_id, :user_id, NOW());

-- Lấy UserExamID vừa tạo ra để dùng cho các câu trả lời
SELECT LAST_INSERT_ID() AS UserExamID;

-- 7. Lưu đáp án trắc nghiệm của sinh viên (Single/Multiple choice)
INSERT INTO UserAnswers (UserExamID, QuestionID, AnswerID, TextAnswer, IsCorrect)
SELECT :user_exam_id, :question_id, :answer_id, NULL, a.IsCorrect
FROM Answers a
WHERE a.AnswerID = :answer_id;

-- 8. Lưu đáp án câu điền (Fill) – tự luận ngắn
INSERT INTO UserAnswers (UserExamID, QuestionID, AnswerID, TextAnswer, IsCorrect)
VALUES (:user_exam_id, :question_id, NULL, :text_answer, NULL); 
-- IsCorrect để NULL nếu cần giáo viên chấm tay sau

-- 9. Tính điểm tự động và kết thúc bài thi (gọi khi sinh viên nhấn Nộp bài)
UPDATE UserExams ue
SET 
    EndTime = NOW(),
    Score = (
        SELECT COALESCE(SUM(q.Level), 0)
        FROM UserAnswers ua
        JOIN Questions q ON ua.QuestionID = q.QuestionID
        WHERE ua.UserExamID = ue.UserExamID
          AND ua.IsCorrect = TRUE
    )
WHERE ue.UserExamID = :user_exam_id;

-- 10. Xem lịch sử làm bài của một sinh viên
SELECT 
    ue.UserExamID,
    e.Title,
    s.SubjectName,
    ue.StartTime,
    ue.EndTime,
    ue.Score,
    e.Duration
FROM UserExams ue
JOIN Exams e ON ue.ExamID = e.ExamID
JOIN Subjects s ON e.SubjectID = s.SubjectID
WHERE ue.UserID = :user_id
ORDER BY ue.StartTime DESC;

-- 11. Giáo viên xem danh sách sinh viên đã thi bài của mình + điểm số
SELECT 
    u.UserID,
    u.FullName,
    u.Email,
    ue.StartTime,
    ue.EndTime,
    ue.Score,
    CASE WHEN ue.EndTime IS NULL THEN 'Đang làm' ELSE 'Đã nộp' END AS Status
FROM UserExams ue
JOIN Users u ON ue.UserID = u.UserID
WHERE ue.ExamID = :exam_id
ORDER BY ue.Score DESC NULLS LAST, ue.EndTime ASC;

-- 12. Xem chi tiết đáp án của một sinh viên trong một bài thi cụ thể (dùng để chấm lại hoặc xem lại)
SELECT 
    q.Content AS Question,
    q.QuestionType,
    a.AnswerText AS ChosenAnswer,
    ua.TextAnswer,
    ua.IsCorrect,
    q.Level
FROM UserAnswers ua
JOIN Questions q ON ua.QuestionID = q.QuestionID
LEFT JOIN Answers a ON ua.AnswerID = a.AnswerID
WHERE ua.UserExamID = :user_exam_id
ORDER BY q.QuestionID;

-- 13. Thống kê điểm trung bình theo từng môn học
SELECT 
    s.SubjectName,
    COUNT(ue.UserExamID) AS SoLuongThi,
    ROUND(AVG(ue.Score), 2) AS DiemTrungBinh,
    MAX(ue.Score) AS DiemCaoNhat,
    MIN(ue.Score) AS DiemThapNhat
FROM UserExams ue
JOIN Exams e ON ue.ExamID = e.ExamID
JOIN Subjects s ON e.SubjectID = s.SubjectID
WHERE ue.Score IS NOT NULL
GROUP BY s.SubjectID, s.SubjectName
ORDER BY DiemTrungBinh DESC;

-- 14. Top 10 sinh viên có điểm cao nhất một bài thi cụ thể
SELECT 
    u.FullName,
    u.Email,
    ue.Score,
    ue.EndTime
FROM UserExams ue
JOIN Users u ON ue.UserID = u.UserID
WHERE ue.ExamID = :exam_id AND ue.Score IS NOT NULL
ORDER BY ue.Score DESC, ue.EndTime ASC
LIMIT 10;

-- 15. Đếm số lượng câu hỏi theo loại trong một bài thi (dùng để kiểm tra trước khi mở thi)
SELECT 
    q.QuestionType,
    COUNT(*) AS SoLuong,
    SUM(q.Level) AS TongHeSo
FROM ExamQuestions eq
JOIN Questions q ON eq.QuestionID = q.QuestionID
WHERE eq.ExamID = :exam_id
GROUP BY q.QuestionType;