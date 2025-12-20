# TÀI LIỆU API

# API: Đăng ký & Đăng nhập

Tài liệu này mô tả các endpoint cơ bản để **đăng ký (register)**, **đăng nhập (login)**, **lấy thông tin user hiện tại**, và **refresh token**. 

---

## Tổng quan

- **Base URL (prod):** `https://api.example.com/`
- **Authentication:** Access token (Bearer JWT) cho các endpoint bảo vệ. Refresh token dùng để lấy access token mới.
- **Response format:** JSON
- **Time format:** ISO 8601 UTC (`2025-11-13T14:22:00Z`)

---

## Quy ước chung

- Header bắt buộc cho các request bảo vệ: `Authorization: Bearer <access_token>`
- Content-Type cho request body: `application/json`
- Mã lỗi chung: HTTP status + body dạng `{”error” :”MÔ TẢ LỖI“}`
- Mã thành công chung: HTTP status + body dang {”message”:”MÔ TẢ THÀNH CÔNG”}

---

## Endpoint 1 - Xin gia nhập lớp

**POST `/api/student/enroll`**

- **Mô tả: Học sinh xin gia nhập lớp **
- **HTTP:** POST 
- **URL:** `/api/student/enroll`
- **Headers:** `Authorization: Bearer <access_token>`
- **Request body:**

```json
{
    "classCode":"wyld1h50",
    "note":"Xin tham gia vào lớp Học lâp trình"
}
```

- **Response body:**

```json
{
    "newClass": {
        "id": "dfbcd5a0-7b47-4bdb-a15a-ec5b162ffb5b",
        "teacher_id": "2f5d4ab2-d9a9-43f7-9175-9ec7f1ccc37c",
        "name": "Tin học đại cương",
        "code": "wyld1h50",
        "description": "Học lâp trình vào sáng t6",
        "created_at": "2025-12-05T11:33:34.257Z",
        "updated_at": "2025-12-05T11:33:34.257Z"
    },
    "message": "Lớp học đã được tạo thành công"
}
```

- **401 Unauthorized** (missing/invalid token)

```json
{
    "error": "Unauthorized"
}
```
## Endpoint 2 - Xem danh sách lớp có trạng thái [approved,pending]

**GET `/api/student/classes?status=approved`**

- **Mô tả: Học sinh xem danh sách lớp đang có trạng thái là status**
- **HTTP:** GET 
- **URL:** `/api/student/classes`
- **Headers:** `Authorization: Bearer <access_token>`

- **Response body:**

```json
[
    {
        "id": "dfbcd5a0-7b47-4bdb-a15a-ec5b162ffb5b",
        "teacher_id": "2f5d4ab2-d9a9-43f7-9175-9ec7f1ccc37c",
        "name": "Tin học đại cương",
        "code": "wyld1h50",
        "description": "Học lâp trình vào sáng t6",
        "created_at": "2025-12-05T11:33:34.257Z",
        "updated_at": "2025-12-05T11:33:34.257Z"
    }
]
```

- **401 Unauthorized** (missing/invalid token)

```json
{
    "error": "Unauthorized"
}
```


## Endpoint 3 — Sinh viên rời lớp học  ( Dành cho sinh viên)

**DELETE`/api/student/classes/id`**

- **Mô tả: Sinh viên rời lớp học theo id của lớp**
- **HTTP: DELETE**
- **URL:** **`/api/student/classes/id`**
- **Headers:** `Authorization: Bearer <access_token>`

- **Response body:**
    
    **204 No Content**


- **401 Unauthorized** (missing/invalid token)

```json
{
    "error": "Unauthorized"
}
```

## Endpoint 4 — Sinh viên lấy danh sách đề thi trong lớp học  ( Dành cho sinh viên)

**GET`/api/student/exams/classes/id`**

- **Mô tả: Sinh viên lấy danh sách đề thi trong lớp học theo id của lớp**
- **HTTP: POST**
- **URL:** **`/api/student/exams/classes/id`**
- **Headers:** `Authorization: Bearer <access_token>`

- **Response body:**
    
    **200 OK**
    

```json
[
    {
        "id": "7d19364a-f5ae-4f81-bcec-bd405f4a9460",
        "title": "Kỳ thi giữa kỳ môn Toán lớp 10A1",
        "starts_at": "2025-12-15T01:00:00.000Z",
        "ends_at": "2025-12-15T02:30:00.000Z",
        "duration": 3600,
        "passing_score": "5",
        "status": "ended"
    }
]
```

- **401 Unauthorized** (missing/invalid token)

```json
{
    "error": "Unauthorized"
}
```

