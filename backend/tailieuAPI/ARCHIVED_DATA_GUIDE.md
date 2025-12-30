# 🗄️ Hướng dẫn xem dữ liệu đã lưu trữ (Archived Data)

## Tổng quan

Hệ thống sử dụng **soft delete** - dữ liệu bị "xóa" không thực sự bị xóa khỏi database mà chỉ bị đánh dấu là đã xóa (`is_deleted = true`). Điều này cho phép:
- Khôi phục dữ liệu khi cần
- Xem lại lịch sử dữ liệu cũ
- Đảm bảo tính toàn vẹn dữ liệu

---

## 📋 Các API hỗ trợ xem archived data

### 1. Lớp học (Classes)

#### Xem tất cả lớp học (bao gồm đã xóa)
```http
GET /api/teacher/classes?includeDeleted=true
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
[
  {
    "id": "class-id-1",
    "name": "Lớp Toán Cao Cấp",
    "code": "abc123",
    "is_deleted": false,
    "deleted_at": null,
    "teacher_id": "teacher-id",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  },
  {
    "id": "class-id-2",
    "name": "Lớp Lập Trình Web",
    "code": "xyz789",
    "is_deleted": true,
    "deleted_at": "2025-12-20T10:30:00Z",
    "deleted_by": "admin-id",
    "teacher_id": "teacher-id",
    "created_at": "2024-09-01T00:00:00Z",
    "updated_at": "2025-12-20T10:30:00Z"
  }
]
```

#### Xem chi tiết lớp đã xóa
```http
GET /api/teacher/classes/:id?includeDeleted=true
Authorization: Bearer YOUR_TOKEN
```

---

### 2. Template đề thi (Exam Templates)

#### Xem tất cả template (bao gồm từ lớp đã xóa)
```http
GET /api/teacher/exam-templates?includeDeleted=true
Authorization: Bearer YOUR_TOKEN
```

**Response sẽ bao gồm:**
- Templates từ lớp đang hoạt động
- Templates từ lớp đã xóa mềm
- Thông tin `Renamedclass.is_deleted` để phân biệt

```json
[
  {
    "id": "template-id-1",
    "title": "Đề thi giữa kỳ",
    "class_id": "class-id-1",
    "is_deleted": false,
    "Renamedclass": {
      "id": "class-id-1",
      "name": "Lớp Toán",
      "is_deleted": false
    }
  },
  {
    "id": "template-id-2",
    "title": "Đề thi cuối kỳ (archived)",
    "class_id": "class-id-2",
    "is_deleted": true,
    "deleted_at": "2025-12-20T10:35:00Z",
    "Renamedclass": {
      "id": "class-id-2",
      "name": "Lớp Web (đã xóa)",
      "is_deleted": true
    }
  }
]
```

#### Xem template của lớp đã xóa
```http
GET /api/teacher/classes/:classId/exam-templates?includeDeleted=true
Authorization: Bearer YOUR_TOKEN
```

**Use case:** Giáo viên muốn xem lại đề thi cũ từ học kỳ trước (lớp đã đóng/xóa)

---

### 3. Câu hỏi (Questions)

#### Xem tất cả câu hỏi (bao gồm đã xóa)
```http
GET /api/teacher/questions?includeDeleted=true
Authorization: Bearer YOUR_TOKEN
```

---

## ⚠️ Lưu ý quan trọng

### Cascade Delete
Khi xóa lớp học, hệ thống tự động xóa mềm:
1. ✅ Tất cả **exam_template** của lớp
2. ✅ Tất cả **exam_instance** của các template đó

```
Lớp học (deleted)
  └── Template 1 (auto deleted)
        └── Instance 1.1 (auto deleted)
        └── Instance 1.2 (auto deleted)
  └── Template 2 (auto deleted)
        └── Instance 2.1 (auto deleted)
```

### Cascade Restore
Khi khôi phục lớp học:
1. ✅ Lớp học được restore
2. ✅ Tất cả templates tự động restore
3. ✅ Tất cả instances tự động restore

### Dashboard và Thống kê
- 📊 Dữ liệu đã xóa mềm **KHÔNG** được tính trong dashboard
- 📈 Điểm số của sinh viên chỉ tính từ lớp/kỳ thi chưa xóa
- 📉 Khi xóa lớp, dashboard tự động cập nhật (loại bỏ dữ liệu từ lớp đó)

---

## 🎯 Use Cases thực tế

### Use Case 1: Xem lại đề thi học kỳ cũ
```javascript
// Giáo viên muốn xem lại đề thi của học kỳ trước (lớp đã đóng)
const response = await fetch(
  '/api/teacher/classes/OLD_CLASS_ID/exam-templates?includeDeleted=true',
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);

const archivedTemplates = await response.json();
// Có thể dùng lại template cũ cho học kỳ mới
```

### Use Case 2: Kiểm tra lớp đã xóa
```javascript
// Xem tất cả lớp bao gồm cả đã xóa
const response = await fetch(
  '/api/teacher/classes?includeDeleted=true',
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);

const allClasses = await response.json();
const deletedClasses = allClasses.filter(c => c.is_deleted);
const activeClasses = allClasses.filter(c => !c.is_deleted);
```

### Use Case 3: Restore lớp học cũ
```javascript
// 1. Tìm lớp đã xóa
const response = await fetch(
  '/api/teacher/classes?includeDeleted=true',
  { headers: { 'Authorization': `Bearer ${token}` } }
);

const classes = await response.json();
const oldClass = classes.find(c => c.code === 'old-code' && c.is_deleted);

// 2. Restore lớp (tự động restore templates và instances)
await fetch(`/api/teacher/classes/${oldClass.id}/restore`, {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## 🔍 Phân biệt dữ liệu Active vs Archived

Khi gọi API với `includeDeleted=true`, response sẽ bao gồm các trường:

```typescript
interface ArchivedData {
  id: string;
  // ... other fields
  is_deleted: boolean;        // true = đã xóa, false = đang hoạt động
  deleted_at: string | null;  // Timestamp khi xóa (ISO 8601)
  deleted_by: string | null;  // User ID người xóa
}
```

**Frontend có thể:**
- Hiển thị badge "Archived" cho items đã xóa
- Disabled các actions edit/delete cho archived items
- Chỉ cho phép restore

---

## 📊 Ví dụ UI Implementation

```jsx
// Component hiển thị danh sách lớp với archived items
function ClassList() {
  const [showArchived, setShowArchived] = useState(false);
  const [classes, setClasses] = useState([]);
  
  useEffect(() => {
    const url = `/api/teacher/classes${showArchived ? '?includeDeleted=true' : ''}`;
    fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setClasses);
  }, [showArchived]);
  
  return (
    <div>
      <label>
        <input 
          type="checkbox" 
          checked={showArchived}
          onChange={e => setShowArchived(e.target.checked)}
        />
        Hiển thị lớp đã lưu trữ
      </label>
      
      {classes.map(cls => (
        <div key={cls.id} className={cls.is_deleted ? 'archived' : ''}>
          <h3>{cls.name}</h3>
          {cls.is_deleted && (
            <>
              <span className="badge">Archived</span>
              <small>Đã xóa: {new Date(cls.deleted_at).toLocaleString()}</small>
              <button onClick={() => restore(cls.id)}>Khôi phục</button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## ✅ Summary

| Tính năng | Default Behavior | With `includeDeleted=true` |
|-----------|------------------|---------------------------|
| Lấy lớp học | Chỉ lớp active | Cả active + archived |
| Lấy templates | Chỉ từ lớp active | Cả từ lớp active + archived |
| Dashboard stats | Chỉ tính active | N/A (luôn chỉ tính active) |
| Xóa lớp | Cascade soft delete | N/A |
| Restore lớp | Cascade restore | N/A |

**Khuyến nghị:**
- Mặc định không dùng `includeDeleted` (UX sạch sẽ hơn)
- Chỉ dùng khi cần xem archive hoặc restore
- Hiển thị UI riêng cho archived data (badge, màu mờ, etc.)
