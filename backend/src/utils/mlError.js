// utils/mlErrors.js - shared by every ML-backed controller
const sendMlError = (res, error, ApiResponse) => {
  console.error(error);
  if (error.code === "ML_UNAVAILABLE") {
    return res.status(503).json(new ApiResponse(503, "AI service is currently unavailable"));
  }
  if (error.status === 422) {
    return res.status(422).json(new ApiResponse(422, error.message));
  }
  if (error.status) {
    return res.status(502).json(new ApiResponse(502, "AI service error"));
  }
  return res.status(500).json(new ApiResponse(500, "Internal server error"));
};
module.exports = { sendMlError };