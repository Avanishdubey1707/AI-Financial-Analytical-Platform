const {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
} = require("../controller/user.controller");

const { Router } = require("express");
const verifyJWT = require("../middleware/auth.middleware");
const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.use(verifyJWT);
router.route("/logout").post(logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").put(changePassword);
router.route("/current-user").get(getCurrentUser);

module.exports = router;
