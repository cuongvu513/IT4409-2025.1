const teacherController = require("../controllers/teacherController");
const express = require("express");
const router = express.Router();

router.post("/classes", teacherController.createClass);
router.get("/classes", teacherController.getClassesByTeacher);
router.get("/classes/:id", teacherController.getClassById);
router.put("/classes/:id", teacherController.updateClass);
router.delete("/classes/:id", teacherController.deleteClass);
router.get("/classes/:id/enrollment-requests", teacherController.getEnrollmentRequests);
router.post("/enrollment-requests/approve", teacherController.approveEnrollmentRequest);


module.exports = router;