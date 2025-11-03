const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// phục vụ file tĩnh từ thư mục "src/public"
app.use(express.static(path.join(__dirname, 'public')));

// route mặc định
app.get('/', (req, res) => {
  res.send(`
    <h1>Xin chào từ server Node.js 👋</h1>
    <p>Nếu bạn đọc được dòng này thì npm và server đều chạy OK.</p>
  `);
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
