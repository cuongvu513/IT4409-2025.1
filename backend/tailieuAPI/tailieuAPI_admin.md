# TÀI LIỆU API - ADMIN

# API: Quản lý người dùng, Quản lý lớp học & Giám sát kỳ thi

Tài liệu này mô tả các endpoint dành cho **Admin** để quản lý người dùng, lớp học và giám sát kỳ thi trong hệ thống.

**Lưu ý:** Admin KHÔNG soạn đề thi, chỉ giám sát và kiểm soát kỳ thi.

---

## Tổng quan

- **Base URL (prod):** `https://api.example.com/`
- **Authentication:** Access token (Bearer JWT) với role `admin`
- **Response format:** JSON
- **Time format:** ISO 8601 UTC (`2025-11-13T14:22:00Z`)

---

## Quy ước chung

- Header bắt buộc cho các request: `Authorization: Bearer <access_token>`
- Content-Type cho request body: `application/json`
- Mã lỗi chung: HTTP status + body dạng `{"error": "MÔ TẢ LỖI"}`
- Mã thành công chung: HTTP status + body dạng `{"message": "MÔ TẢ THÀNH CÔNG"}`
- **Lưu ý:** Tất cả endpoint yêu cầu role `admin`, nếu không sẽ trả về `403 Forbidden`

---

## Endpoint 1 - Lấy thống kê tổng quan

**GET `/api/admin/statistics`**

- **Mô tả: Lấy thống kê tổng quan hệ thống**
- **HTTP:** GET 
- **URL:** `/api/admin/statistics`
- **Headers:** `Authorization: Bearer <access_token>`

- **Response body:**

```json
{
  "total_users": 150,
  "active_users": 145,
  "locked_users": 5,
  "by_role": {
    "student": 120,
    "teacher": 25,
    "admin": 5
  },
  "new_users_last_7_days": 12
}
```

- **401 Unauthorized** (missing/invalid token)

```json
{
  "error": "Không có quyền truy cập"
}
```

- **403 Forbidden** (không phải admin)

```json
{
  "error": "Chỉ dành cho quản trị viên"
}
```

---

## Endpoint 2 - Lấy danh sách người dùng
**GET `/api/admin/users?role=student&status=active&search=john&page=1&limit=50`**

- **Mô tả: Lấy danh sách người dùng với bộ lọc**
- **HTTP:** GET 
- **URL:** `/api/admin/users`
- **Headers:** `Authorization: Bearer <access_token>`
- **Query Parameters:**
  - `role` (optional): `student`, `teacher`, `admin`
  - `status` (optional): `active`, `locked`
  - `search` (optional): Tìm kiếm theo tên hoặc email
  - `page` (optional): Số trang (default: 1)
  - `limit` (optional): Số lượng mỗi trang (default: 50)

- **Response body:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "student@example.com",
      "name": "John Doe",
      "role": "student",
      "role_id": "uuid",
      "status": "active",
      "created_at": "2025-01-01T00:00:00Z",
      "last_login_at": "2025-12-25T10:30:00Z",
      "active_sessions": 2
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 120,
    "totalPages": 3
  }
}
```

- **401 Unauthorized** (missing/invalid token)

```json
{
  "error": "Không có quyền truy cập"
}
```

---

## Endpoint 3 - Chi tiết người dùng
**GET `/api/admin/users/:id`**

- **Mô tả: Lấy thông tin chi tiết một người dùng**
- **HTTP:** GET 
- **URL:** `/api/admin/users/:id`
- **Headers:** `Authorization: Bearer <access_token>`

- **Response body:**
```json
{
  "id": "uuid",
  "email": "student@example.com",
  "name": "John Doe",
  "bio": "Student bio",
  "role": "student",
  "role_id": "uuid",
  "status": "active",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-12-20T00:00:00Z",
  "last_login_at": "2025-12-25T10:30:00Z",
  "classes_count": 5,
  "enrollments_count": 3,
  "sessions": [
    {
      "id": "uuid",
      "ip": "192.168.1.1",
      "created_at": "2025-12-25T10:00:00Z",
      "expires_at": "2025-12-26T10:00:00Z",
      "is_active": true
    }
  ]
}
```

- **404 Not Found** (user không tồn tại)

```json
{
  "error": "User not found"
}
```

---

## Endpoint 4 - Khóa tài khoản
**PUT `/api/admin/users/:id/lock`**

- **Mô tả: Khóa tài khoản người dùng (set is_active = false)**
- **HTTP:** PUT
- **URL:** `/api/admin/users/:id/lock`
- **Headers:** `Authorization: Bearer <access_token>`

- **Response body:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "status": "locked",
  "message": "User locked successfully"
}
```

- **403 Forbidden** (không thể khóa tài khoản của chính mình)

```json
{
  "error": "Cannot lock your own account"
}
```

---

## Endpoint 5 - Mở khóa tài khoản
**PUT `/api/admin/users/:id/unlock`**

- **Mô tả: Mở khóa tài khoản người dùng (set is_active = true)**
- **HTTP:** PUT
- **URL:** `/api/admin/users/:id/unlock`
- **Headers:** `Authorization: Bearer <access_token>`

- **Response body:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "status": "active",
  "message": "User unlocked successfully"
}
```

---

## Endpoint 6 - Reset mật khẩu
**POST `/api/admin/users/:id/reset-password`**

- **Mô tả: Reset mật khẩu người dùng về mật khẩu mặc định**
- **HTTP:** POST
- **URL:** `/api/admin/users/:id/reset-password`
- **Headers:** `Authorization: Bearer <access_token>`
- **Body (optional):**
```json
{
  "password": "NewPassword123"
}
```

Nếu không truyền `password`, mật khẩu mặc định sẽ là `Password123`

- **Response body:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "message": "Password reset successfully",
  "temporary_password": "NewPassword123"
}
```

- **403 Forbidden** (không thể reset mật khẩu của chính mình)

```json
{
  "error": "Cannot reset your own password through admin panel. Use profile settings."
}
```

---

## Endpoint 7 - Lấy danh sách lớp học

**GET `/api/admin/classes?search=tin+hoc&page=1&limit=50`**

- **Mô tả: Lấy danh sách tất cả lớp học trong hệ thống**
- **HTTP:** GET 
- **URL:** `/api/admin/classes`
- **Headers:** `Authorization: Bearer <access_token>`
- **Query Parameters:**
  - `search` (optional): Tìm kiếm theo tên lớp hoặc code
  - `page` (optional): Số trang (default: 1)
  - `limit` (optional): Số lượng mỗi trang (default: 50)
  - Không có **Query** thì sẽ lấy toàn bộ

- **Response body:**

```json
{
  "classes": [
    {
      "id": "uuid",
      "name": "Tin học đại cương",
      "code": "wyld1h50",
      "description": "Học lập trình vào sáng t6",
      "teacher": {
        "id": "uuid",
        "name": "Nguyễn Văn A",
        "email": "teacher@example.com"
      },
      "student_count": 25,
      "exam_count": 3,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-12-20T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 15,
    "totalPages": 1
  }
}
```

- **401 Unauthorized** (missing/invalid token)

```json
{
  "error": "Không có quyền truy cập"
}
```

---

## Endpoint 8 - Chi tiết lớp học

**GET `/api/admin/classes/:id`**

- **Mô tả: Lấy thông tin chi tiết một lớp học**
- **HTTP:** GET 
- **URL:** `/api/admin/classes/:id`
- **Headers:** `Authorization: Bearer <access_token>`

- **Response body:**

```json
{
  "id": "uuid",
  "name": "Tin học đại cương",
  "code": "wyld1h50",
  "description": "Học lập trình vào sáng t6",
  "teacher": {
    "id": "uuid",
    "name": "Nguyễn Văn A",
    "email": "teacher@example.com"
  },
  "students": [
    {
      "id": "uuid",
      "name": "Trần Thị B",
      "email": "student@example.com",
      "enrolled_at": "2025-01-05T00:00:00Z"
    }
  ],
  "exams": [
    {
      "id": "uuid",
      "title": "Kỳ thi giữa kỳ",
      "duration_seconds": 3600,
      "created_at": "2025-01-10T00:00:00Z"
    }
  ],
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-12-20T00:00:00Z"
}
```

- **404 Not Found** (lớp học không tồn tại)

```json
{
  "error": "Class not found"
}
```

---

## Endpoint 9 - Lấy danh sách kỳ thi

**GET `/api/admin/exams?status=ongoing&search=giua+ky&page=1&limit=50`**

- **Mô tả: Lấy danh sách tất cả kỳ thi trong hệ thống**
- **HTTP:** GET 
- **URL:** `/api/admin/exams`
- **Headers:** `Authorization: Bearer <access_token>`
- **Query Parameters:**
  - `status` (optional): `upcoming` (chưa mở), `ongoing` (đang thi), `ended` (đã kết thúc), `suspended` (tạm dừng)
  - `search` (optional): Tìm kiếm theo tên đề thi
  - `page` (optional): Số trang (default: 1)
  - `limit` (optional): Số lượng mỗi trang (default: 50)
  - Không có **Query** thì sẽ lấy toàn bộ
- **Response body:**

```json
{
  "exams": [
    {
      "id": "uuid",
      "title": "Kỳ thi giữa kỳ môn Toán",
      "class": {
        "id": "uuid",
        "name": "Toán lớp 10A1",
        "code": "toan10a1"
      },
      "teacher": {
        "id": "uuid",
        "name": "Nguyễn Văn A",
        "email": "teacher@example.com"
      },
      "starts_at": "2025-12-20T01:00:00.000Z",
      "ends_at": "2025-12-20T02:30:00.000Z",
      "duration_seconds": 3600,
      "published": true,
      "status": "ongoing",
      "total_sessions": 25,
      "submitted_sessions": 15,
      "created_at": "2025-12-10T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 30,
    "totalPages": 1
  }
}
```

**Giải thích trạng thái:**
- `upcoming`: Kỳ thi chưa bắt đầu (thời gian hiện tại < starts_at)
- `ongoing`: Kỳ thi đang diễn ra (starts_at ≤ now ≤ ends_at)
- `ended`: Kỳ thi đã kết thúc (now > ends_at)
- `unpublished`: Kỳ thi chưa công bố

- **401 Unauthorized** (missing/invalid token)

```json
{
  "error": "Không có quyền truy cập"
}
```

---

## Endpoint 10 - Chi tiết kỳ thi

**GET `/api/admin/exams/:id`**

- **Mô tả: Lấy thông tin chi tiết một kỳ thi**
- **HTTP:** GET 
- **URL:** `/api/admin/exams/:id`
- **Headers:** `Authorization: Bearer <access_token>`

- **Response body:**

```json
{
  "id": "uuid",
  "title": "Kỳ thi giữa kỳ môn Toán",
  "description": "Kiểm tra kiến thức chương 1-3",
  "class": {
    "id": "uuid",
    "name": "Toán lớp 10A1",
    "code": "toan10a1"
  },
  "teacher": {
    "id": "uuid",
    "name": "Nguyễn Văn A",
    "email": "teacher@example.com"
  },
  "starts_at": "2025-12-20T01:00:00.000Z",
  "ends_at": "2025-12-20T02:30:00.000Z",
  "duration_seconds": 3600,
  "passing_score": "5.00",
  "published": true,
  "show_answers": false,
  "status": "ongoing",
  "question_count": 20,
  "sessions": [
    {
      "id": "uuid",
      "state": "submitted",
      "started_at": "2025-12-20T01:05:00.000Z",
      "student": {
        "id": "uuid",
        "name": "Trần Thị B",
        "email": "student@example.com"
      },
      "score": "8.50",
      "max_score": "10.00"
    }
  ],
  "created_at": "2025-12-10T00:00:00.000Z"
}
```

- **404 Not Found** (kỳ thi không tồn tại)

```json
{
  "error": "Exam not found"
}
```

---



## Endpoint 11 - Xóa lớp học

**DELETE `/api/admin/classes/:id`**

- **Mô tả: Xóa lớp học**
  - Chỉ xóa được khi chưa có dữ liệu thi (exam sessions)
  - Nếu có bài thi đã được làm, không cho phép xóa
- **HTTP:** DELETE
- **URL:** `/api/admin/classes/:id`
- **Headers:** `Authorization: Bearer <access_token>`

- **Response body:**

```json
{
  "class_id": "uuid",
  "class_name": "Tin học đại cương",
  "message": "Class deleted successfully"
}
```

- **400 Bad Request** (lớp có dữ liệu thi)

```json
{
  "error": "Cannot delete class with active exam sessions. Class has exam data."
}
```

- **404 Not Found** (lớp học không tồn tại)

```json
{
  "error": "Class not found"
}
```

---
