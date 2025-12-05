const studentController = require("../controllers/studentController");
const express = require("express");
const router = express.Router();

router.post("/enroll", studentController.joinClass);
router.get("/classes", studentController.getEnrolledClasses);

module.exports = router;
