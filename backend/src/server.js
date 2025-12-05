require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const apiRoutes = require("./routes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// API entry
app.use("/api", apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// error handler
app.use((err, req, res, next) => {
  console.error("🔥 ERROR:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal error",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
