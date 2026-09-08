const {
  getAllFraudAlerts,
  getFraudAlertById,
  updateFraudAlertStatus,
} = require("../controller/fraud.controller");
const verifyJWT = require("../middleware/auth.middleware");

const Router = require("express").Router;

const router = Router();

router.use(verifyJWT);

router.route("/").get(getAllFraudAlerts);

router.route("/:id").get(getFraudAlertById);
router.route("/:id/status").put(updateFraudAlertStatus);

module.exports = router;
