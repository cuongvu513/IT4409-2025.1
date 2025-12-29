import React, { useState } from 'react';
import teacherService from '../../services/teacherService';
import styles from './ExamTemplateForm.module.scss';

const ExamTemplateForm = ({ classId, onCreated, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(''); // minutes
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [passingScore, setPassingScore] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Tiêu đề là bắt buộc');
      return;
    }

    const data = {
      title: title.trim(),
      description: description.trim() || undefined,
      class_id: classId,
      duration_seconds: duration ? parseInt(duration, 10) * 60 : undefined,
      shuffle_questions: shuffleQuestions,
      passing_score: passingScore !== '' ? parseFloat(passingScore) : undefined,
    };

    try {
      setLoading(true);
      const res = await teacherService.createExamTemplate(data);
      const newTemplate = res.data?.newTemplate || res.data;
      if (onCreated) onCreated(newTemplate);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Tạo mẫu đề thi thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.row}>
        <label>Tiêu đề <span className={styles.required}>*</span></label>
        <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className={styles.row}>
        <label>Mô tả</label>
        <textarea className={styles.textarea} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className={styles.rowInline}>
        <div>
          <label>Thời lượng (phút)</label>
          <input className={styles.input} type="number" min="1" value={duration} onChange={(e) => setDuration(e.target.value)} />
        </div>

        <div>
          <label>Ngưỡng qua bài kiểm tra (%)</label>
          <input className={styles.input} type="number" min="0" max="100" step="0.1" value={passingScore} onChange={(e) => setPassingScore(e.target.value)} />
        </div>
      </div>

      <div className={styles.row}>
        <label>
          <input type="checkbox" checked={shuffleQuestions} onChange={(e) => setShuffleQuestions(e.target.checked)} />
          {' '}Trộn câu hỏi
        </label>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.cancel} onClick={onClose} disabled={loading}>Hủy</button>
        <button type="submit" className={styles.submit} disabled={loading}>{loading ? 'Đang tạo...' : 'Tạo mẫu đề thi'}</button>
      </div>
    </form>
  );
};

export default ExamTemplateForm;
