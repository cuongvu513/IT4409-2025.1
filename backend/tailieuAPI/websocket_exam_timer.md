# WebSocket Exam Timer - Hướng dẫn sử dụng

## Tổng quan

Tính năng WebSocket Exam Timer cho phép học sinh nhận thời gian làm bài còn lại theo thời gian thực thông qua WebSocket.

## Cấu hình

WebSocket server chạy trên cùng cổng với HTTP server, sử dụng namespace `/exam-timer`.

## Kết nối

### Từ phía Client

```javascript
import io from 'socket.io-client';

// Kết nối với JWT token
const socket = io('http://172.31.85.93:3000/exam-timer', {
  auth: {
    token: 'YOUR_JWT_TOKEN' // Token xác thực của học sinh
  }
});

// Hoặc sử dụng header Authorization
const socket = io('http://172.31.85.93:3000/exam-timer', {
  extraHeaders: {
    Authorization: 'Bearer YOUR_JWT_TOKEN'
  }
});
```

## API Events

### 1. Subscribe - Đăng ký nhận thời gian của một kỳ thi

Client emit event `subscribe` để bắt đầu nhận cập nhật thời gian:

```javascript
socket.emit('subscribe', {
  examInstanceId: 'uuid-of-exam-instance'
});
```

**Response:**
- Event `time-update`: Cập nhật thời gian mỗi giây
- Event `error`: Nếu có lỗi xảy ra

### 2. Unsubscribe - Hủy đăng ký

```javascript
socket.emit('unsubscribe', {
  examInstanceId: 'uuid-of-exam-instance'
});
```

### 3. Get Active Sessions - Lấy danh sách phiên thi đang hoạt động

```javascript
socket.emit('get-active-sessions');
```

**Response:**
Event `active-sessions` với dữ liệu:
```javascript
{
  sessions: [
    {
      examInstanceId: 'uuid',
      examSessionId: 'uuid',
      remainingSeconds: 3600, // Số giây còn lại
      state: 'started',
      started_at: '2025-12-27T10:00:00Z',
      ends_at: '2025-12-27T12:00:00Z'
    }
  ]
}
```

## Events từ Server

### 1. time-update

Gửi mỗi giây khi đã subscribe:

```javascript
socket.on('time-update', (data) => {
  console.log('Thời gian còn lại:', data.remainingSeconds, 'giây');
  /*
  data = {
    examInstanceId: 'uuid',
    examSessionId: 'uuid',
    remainingSeconds: 3599,
    state: 'started',
    started_at: '2025-12-27T10:00:00Z',
    ends_at: '2025-12-27T12:00:00Z'
  }
  */
});
```

### 2. time-expired

Khi hết thời gian làm bài:

```javascript
socket.on('time-expired', (data) => {
  console.log('Hết giờ làm bài!');
  // Auto submit hoặc thông báo cho người dùng
});
```

### 3. exam-ended

Khi phiên thi kết thúc (đã submit hoặc bị hủy):

```javascript
socket.on('exam-ended', (data) => {
  console.log('Phiên thi đã kết thúc:', data.state);
});
```

### 4. active-sessions

Response cho event `get-active-sessions`:

```javascript
socket.on('active-sessions', (data) => {
  console.log('Các phiên thi đang active:', data.sessions);
});
```

### 5. error

Khi có lỗi xảy ra:

```javascript
socket.on('error', (data) => {
  console.error('Lỗi:', data.message);
  // data.code có thể là: EXAM_NOT_FOUND, NOT_ENROLLED, INVALID_STATE
});
```

### 6. waiting

Khi học sinh subscribe nhưng chưa bắt đầu làm bài:

```javascript
socket.on('waiting', (data) => {
  console.log('Đang chờ bắt đầu làm bài');
  /*
  data = {
    code: 'NOT_STARTED',
    message: 'Bạn chưa bắt đầu làm bài thi này. Vui lòng nhấn "Bắt đầu làm bài" để tiếp tục.',
    examInstanceId: 'uuid',
    canStart: true
  }
  */
  
  // Hiển thị nút "Bắt đầu làm bài"
  // Sau khi gọi API startExam, WebSocket sẽ tự động nhận time-update
});
```

### 7. time-force-update

Khi giáo viên cập nhật thời gian làm bài (cộng thêm giờ):

```javascript
socket.on('time-force-update', (data) => {
  console.log('Giáo viên đã cập nhật thời gian!');
  /*
  data = {
    examInstanceId: 'uuid',
    examSessionId: 'uuid',
    remainingSeconds: 4200, // Thời gian mới
    state: 'started',
    started_at: '2025-12-27T10:00:00Z',
    ends_at: '2025-12-27T12:10:00Z', // Đã được kéo dài
    message: 'Giáo viên đã cập nhật thời gian làm bài'
  }
  */
  
  // Cập nhật lại UI với thời gian mới
  updateTimerDisplay(data.remainingSeconds);
  showNotification(data.message);
});
```

## Ví dụ sử dụng đầy đủ

```javascript
import io from 'socket.io-client';

const token = localStorage.getItem('jwt_token');
const examInstanceId = 'uuid-of-exam';

// Kết nối
const socket = io('http://172.31.85.93:3000/exam-timer', {
  auth: { token }
});

socket.on('connect', () => {
  console.log('Đã kết nối WebSocket');
  
  // Subscribe để nhận thời gian
  socket.emit('subscribe', { examInstanceId });
});

// Nhận cập nhật thời gian
socket.on('time-update', (data) => {
  const minutes = Math.floor(data.remainingSeconds / 60);
  const seconds = data.remainingSeconds % 60;
  
  // Cập nhật UI
  document.getElementById('timer').textContent = 
    `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  // Cảnh báo khi còn 5 phút
  if (data.remainingSeconds === 300) {
    alert('Còn 5 phút!');
  }
});

// Xử lý hết giờ
socket.on('time-expired', (data) => {
  alert('Hết giờ làm bài! Hệ thống sẽ tự động nộp bài.');
  // Gọi API submit
  submitExam(data.examSessionId);
});

// Xử lý lỗi
socket.on('error', (data) => {
  console.error('Lỗi:', data.message);
  if (data.code === 'NOT_ENROLLED') {
    alert('Bạn chưa tham gia lớp học này');
  } else if (data.code === 'EXAM_NOT_FOUND') {
    alert('Kỳ thi không tồn tại');
  }
});

// Xử lý trạng thái chờ (chưa bắt đầu làm bài)
socket.on('waiting', (data) => {
  console.log('Chờ bắt đầu làm bài:', data.message);
  // Hiển thị UI chờ hoặc nút "Bắt đầu làm bài"
  // Khi user gọi API startExam, WebSocket sẽ tự động nhận time-update
});

// Xử lý khi giáo viên cập nhật thời gian
socket.on('time-force-update', (data) => {
  // Cập nhật lại thời gian hiển thị
  const minutes = Math.floor(data.remainingSeconds / 60);
  const seconds = data.remainingSeconds % 60;
  
  document.getElementById('timer').textContent = 
    `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  // Hiển thị thông báo
  alert(data.message || 'Thời gian làm bài đã được cập nhật');
});

// Ngắt kết nối khi rời trang
window.addEventListener('beforeunload', () => {
  socket.emit('unsubscribe', { examInstanceId });
  socket.disconnect();
});
```

## Lưu ý

1. **Xác thực**: Mỗi kết nối WebSocket phải có JWT token hợp lệ
2. **State**: Chỉ học sinh có exam_session ở trạng thái `started` hoặc `pending` mới nhận được cập nhật
3. **Auto-cleanup**: Timer tự động dừng khi:
   - Hết thời gian (remainingSeconds = 0)
   - Học sinh submit bài (state = 'submitted')
   - Socket disconnect
4. **Hiệu suất**: Mỗi học sinh chỉ nên subscribe vào exam mà họ đang làm, tránh subscribe nhiều exam cùng lúc
5. **Cập nhật thời gian real-time**: Khi giáo viên cộng thêm thời gian cho học sinh, event `time-force-update` sẽ được gửi ngay lập tức đến học sinh đó

## Bảo mật

- Token JWT được verify trước khi cho phép kết nối
- Mỗi học sinh chỉ có thể xem thời gian của exam session của chính họ
- Không thể subscribe vào exam của người khác

## Testing

Sử dụng công cụ như Postman hoặc Socket.IO Client để test:

1. Kết nối với token hợp lệ
2. Emit `subscribe` với examInstanceId
3. Xem các event `time-update` được gửi về mỗi giây
4. Test các trường hợp: hết giờ, submit sớm, disconnect
