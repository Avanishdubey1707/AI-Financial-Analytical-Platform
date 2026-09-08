const User= require('../models/user.model')
const jwt = require("jsonwebtoken")

const verifyJWT= async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        if(!token)
            throw new Error("Unauthorized request")
        const decodedToken = jwt.verify(
            token, 
            process.env.JWT_ACCESS_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        if(!user){
            throw new Error("User not found") 
        }
        req.user = user;
        next()
    } catch (error) {
        throw new Error(`${error.message || "Invalid access token"}`)
    }
}

module.exports = verifyJWT;