CREATE DATABASE OnlineExamDB;
USE OnlineExamDB;

-- người dùng
CREATE TABLE Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    FullName VARCHAR(100),
    Email VARCHAR(100) UNIQUE,
    PasswordHash VARCHAR(255),
    Role ENUM('Student', 'Teacher', 'Admin'),
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- môn học 
CREATE TABLE Subjects (
    SubjectID INT AUTO_INCREMENT PRIMARY KEY,
    SubjectName VARCHAR(100) NOT NULL,
    Description VARCHAR(255)
);

-- bài thi 
CREATE TABLE Exams (
    ExamID INT AUTO_INCREMENT PRIMARY KEY,
    SubjectID INT,
    Title VARCHAR(100),		-- tên bài thi 
    Duration INT, -- phút
    StartTime DATETIME,		-- thời gian bắt đầu mở bài thi 
    EndTime DATETIME,		-- thời gian đóng làm bài thi 
    CreatedBy INT,  		-- ID người tạo bài thi 
    FOREIGN KEY (SubjectID) REFERENCES Subjects(SubjectID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID)
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- câu hỏi 
CREATE TABLE Questions (
    QuestionID INT AUTO_INCREMENT PRIMARY KEY,
    SubjectID INT,
    Content TEXT NOT NULL,	-- đề bài 
    Level INT, 				-- hệ số điểm cho câu hỏi này. (1 câu này bằng bao nhiêu câu bình thường)
    QuestionType ENUM('Single', 'Multiple', 'Fill') NOT NULL,	-- loại câu hỏi 
    FOREIGN KEY (SubjectID) REFERENCES Subjects(SubjectID)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- câu hỏi ở bài thi 
CREATE TABLE ExamQuestions (
    ExamID INT,
    QuestionID INT,
    PRIMARY KEY (ExamID, QuestionID),
    FOREIGN KEY (ExamID) REFERENCES Exams(ExamID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (QuestionID) REFERENCES Questions(QuestionID)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- đáp án để sinh viên chọn 
CREATE TABLE Answers (
    AnswerID INT AUTO_INCREMENT PRIMARY KEY,
    QuestionID INT,
    AnswerText VARCHAR(255),
    IsCorrect BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (QuestionID) REFERENCES Questions(QuestionID)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- đáp án của sinh viên chọn 
CREATE TABLE UserAnswers (
    UserAnswerID INT AUTO_INCREMENT PRIMARY KEY,
    UserExamID INT,
    QuestionID INT,
    AnswerID INT NULL,          -- Nếu là chọn đáp án
    TextAnswer TEXT NULL,       -- Nếu là câu điền
    IsCorrect BOOLEAN,
    FOREIGN KEY (UserExamID) REFERENCES UserExams(UserExamID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (QuestionID) REFERENCES Questions(QuestionID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (AnswerID) REFERENCES Answers(AnswerID)
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- kết quả, thông tin bài thi của sinh viên 
CREATE TABLE UserExams (
    UserExamID INT AUTO_INCREMENT PRIMARY KEY,
    ExamID INT,
    UserID INT,
    StartTime DATETIME,
    EndTime DATETIME,
    Score FLOAT,
    FOREIGN KEY (ExamID) REFERENCES Exams(ExamID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
        ON DELETE CASCADE ON UPDATE CASCADE
);

