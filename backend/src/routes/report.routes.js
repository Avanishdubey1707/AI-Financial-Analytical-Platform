const express = require("express");
const router = express.Router();

const {
  getAllReports,
  generateReport,
  getReportById,
  downloadReport,
  deleteReport,
} = require("../controllers/report.controller");
const verifyJWT = require("../middleware/auth.middleware");

router.use(verifyJWT);

// IMPORTANT: /reports/generate must be registered before /reports/:id
router.get("/reports", getAllReports);
router.post("/reports/generate", generateReport);
router.get("/reports/:id", getReportById);
router.get("/reports/:id/download", downloadReport);
router.delete("/reports/:id", deleteReport);

module.exports = router;