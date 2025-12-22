import axios from './axiosClient';

/**
 * Bắt đầu kỳ thi
 */
export const startExam = async (examId) => {
  const res = await axios.post(`/api/student/exams/${examId}/start`);
  return res.data;
};

/**
 * Lấy câu hỏi theo session
 */
export const getSessionQuestions = async (sessionId, sessionToken) => {
  const res = await axios.get(
    `/api/student/sessions/${sessionId}/questions`,
    {
      headers: { 'X-Exam-Token': sessionToken },
    }
  );
  return res.data;
};

/**
 * Lưu đáp án (upsert)
 */
export const saveAnswer = async (sessionId, sessionToken, questionId, choiceIds) => {
  const res = await axios.post(
    `/api/student/sessions/${sessionId}/answers`,
    {
      question_id: questionId,
      choice_ids: choiceIds,
    },
    {
      headers: { 'X-Exam-Token': sessionToken },
    }
  );
  return res.data;
};

/**
 * Heartbeat / anti-cheat
 */
export const sendHeartbeat = async (sessionId, sessionToken, focusLost) => {
  const res = await axios.post(
    `/api/student/sessions/${sessionId}/heartbeat`,
    { focusLost },
    {
      headers: { 'X-Exam-Token': sessionToken },
    }
  );
  return res.data;
};

/**
 * Submit bài thi
 */
export const submitExam = async (sessionId, sessionToken) => {
  const res = await axios.post(
    `/api/student/sessions/${sessionId}/submit`,
    {},
    {
      headers: { 'X-Exam-Token': sessionToken },
    }
  );
  return res.data;
};
