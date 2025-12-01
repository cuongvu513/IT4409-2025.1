const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

router.use("/auth", require("./authRoutes"));
router.use("/users",auth, require("./userRoutes"));
// router.use("/classes", require("./classRoutes"));
// router.use("/exams", require("./examRoutes"));

module.exports = router;
