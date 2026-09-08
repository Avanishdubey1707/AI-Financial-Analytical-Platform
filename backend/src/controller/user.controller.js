const express = require("express");
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const ApiResponse = require("../utils/ApiResponse");

const options = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: 10 * 24 * 60 * 60 * 1000, // 10 days
};

const generateAccessAndRefreshTokens = async (user) => {
  try {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save();
    return { accessToken, refreshToken };
  } catch (error) {
    throw new Error(`Error generating tokens ${error.message}`);
  }
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password || !name) {
      return res
        .status(400)
        .json(new ApiResponse(400, "Name, email and password are required"));
    }

    const user = await User.findOne({ email });

    if (user) {
      return res.status(400).json(new ApiResponse(400, "User already exists"));
    }

    const newUser = await User.create({
      name,
      email,
      password,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, "User created successfully", newUser));
  } catch (err) {
    console.error(err);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json(new ApiResponse(400, "Email and password are required"));
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json(new ApiResponse(404, "User not found"));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json(new ApiResponse(401, "Invalid credentials"));
    }

    const { accessToken, refreshToken } =
      await generateAccessAndRefreshTokens(user);
    const loggedUser = await User.findOne({ email }).select(
      "-password -refreshToken",
    );
    res.cookie("refreshToken", refreshToken, options);
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,

          "User logged in successfully",
          {
            user: loggedUser,
            accessToken,
            refreshToken,
          },
        ),
      );
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(new ApiResponse(500, `Internal server error ${error.messsage}`));
  }
};

const logoutUser = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user._id });
    if (!user) {
      return res.status(404).json(new ApiResponse(404, "User not found"));
    }
    user.refreshToken = null;
    await user.save();
    res.clearCookie("accessToken", options);
    res.clearCookie("refreshToken", options);
    return res
      .status(200)
      .json(new ApiResponse(200, "User logged out successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiResponse(500, "Error occurred while logging out"));
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    console.log("refresh token:", refreshToken);

    if (!refreshToken) {
      return res
        .status(401)
        .json(new ApiResponse(401, "Refresh token is required"));
    }

    // Verify refresh token
    const decodedToken = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_TOKEN_SECRET,
    );

    // Find user using ID from token
    const user = await User.findById(decodedToken._id);

    if (!user) {
      return res.status(404).json(new ApiResponse(404, "User not found"));
    }

    // Check whether this refresh token is the one stored for this user
    if (user.refreshToken !== refreshToken) {
      return res
        .status(401)
        .json(new ApiResponse(401, "Invalid refresh token"));
    }

    const accessToken = user.generateAccessToken();

    return res.status(200).json(
      new ApiResponse(200, "Access token refreshed successfully", {
        accessToken,
      }),
    );
  } catch (error) {
    console.log("Error:", error.message);

    return res
      .status(401)
      .json(new ApiResponse(401, "Invalid or expired refresh token"));
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, "Old password and new password are required"),
        );
    }
    const user = await User.findOne({ _id: req.user._id });
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res
        .status(401)
        .json(new ApiResponse(401, "Old password is incorrect"));
    }
    user.password = newPassword;
    await user.save();
    return res
      .status(200)
      .json(new ApiResponse(200, "Password changed successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiResponse(500, "Error occurred while changing password"));
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user._id }).select("-password -refreshToken");
    if (!user) {
      return res.status(404).json(new ApiResponse(404, "User not found"));
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, "Current user retrieved successfully", { user }),
      );
  } catch (error) {
    return res.status(500).json(
      new ApiResponse(
        500,

        "Error occurred while retrieving current user",
      ),
    );
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
};
