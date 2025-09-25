const express = require("express");
const router = express.Router();
const { getStudentsByCollege } = require("../controllers/studentController");

router.get("/college/:collegeId", getStudentsByCollege);

module.exports = router;