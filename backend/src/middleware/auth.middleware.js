const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const verifyJWT = async (req, res, next) => {
    try {
        // Get token from HTTP-only cookie
        // or Authorization header
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        // No token
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized request. Please login.",
            });
        }

        // Verify JWT
        const decodedToken = jwt.verify(
            token,
            process.env.JWT_ACCESS_TOKEN_SECRET
        );

        // Make sure token contains user id
        if (!decodedToken?._id) {
            return res.status(401).json({
                success: false,
                message: "Invalid access token.",
            });
        }

        // Find user
        const user = await User.findById(decodedToken._id).select(
            "-password -refreshToken"
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User associated with this token no longer exists.",
            });
        }

        // Attach authenticated user
        req.user = user;

        next();
    } catch (error) {
        console.error("JWT verification error:", error.message);

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Access token expired.",
            });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Invalid access token.",
            });
        }

        return res.status(401).json({
            success: false,
            message: "Authentication failed.",
        });
    }
};

module.exports = verifyJWT;