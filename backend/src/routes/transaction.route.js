const Router = require("express").Router;
const router = Router();
const {
  getAllTransactions,
  addTransaction,
  getTransactionById,
  updateTransactionDetails,
  deleteTransaction,
  getTransactionSummary,
  checkFraud,
} = require("../controller/transaction.controller");
const verifyJWT = require("../middleware/auth.middleware");

router.use(verifyJWT);

router.route("/")
    .get(getAllTransactions)
    .post(addTransaction);

router
  .route("/:id")
  .get(getTransactionById)
  .put(updateTransactionDetails)
  .delete(deleteTransaction);

router.route("/summary").get(getTransactionSummary);

router.route("/:id/check-fraud").get(checkFraud);

module.exports = router;
