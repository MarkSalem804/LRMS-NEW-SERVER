const express = require("express");
const userRouter = express.Router();
const userService = require("./user-service");
const { emitEvent, onlineUsers } = require("../Middlewares/socketio");

userRouter.get("/online-users", async (req, res) => {
  try {
    const online = Array.from(onlineUsers.values()); // e.g. ["Juan", "Pedro"]
    return res.status(200).json({
      success: true,
      message: "Online users fetched successfully",
      data: online,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get online users",
    });
  }
});

userRouter.post("/register", async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      middleName,
      role,
      birthdate,
      age,
    } = req.body;

    // Validate request body
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Call register service
    const result = await userService.register({
      email,
      password,
      firstName,
      lastName,
      middleName,
      role,
      birthdate,
      age,
    });

    // Return success response
    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: result,
    });
  } catch (error) {
    // Return error response
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Login route
userRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }
    // Call login service (now returns requires2FA)
    const result = await userService.login(email, password);

    // If requires2FA, do not emit event or return user data yet
    if (result.requires2FA) {
      return res.status(200).json({
        success: true,
        message: "OTP sent to your email",
        data: result,
      });
    }

    // (If you want to support fallback to old login, keep this, else remove)
    emitEvent("user-just-logged-in", {
      email: result.user.email,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

userRouter.post("/verify-otp", async (req, res) => {
  try {
    const { email, otpCode } = req.body;
    const result = await userService.verifyOtp(email, otpCode);
    // You may want to emit the login event here
    emitEvent("user-just-logged-in", {
      email: result.user.email,
    });
    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      data: result,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

userRouter.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }
    const result = await userService.resendOtp(email);
    return res.status(200).json({
      success: true,
      message: "New OTP sent successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

userRouter.get("/getAllUsers", async (req, res) => {
  try {
    const fetchedData = await userService.getAllUsers();
    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: fetchedData,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

userRouter.get("/getUserProfile/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const fetchedData = await userService.userProfile(id);
    return res.status(200).json({
      success: true,
      message: "User Profile fetched successfully",
      data: fetchedData,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

userRouter.delete("/deleteUser/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const deletedUser = await userService.deleteUser(id);
    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: deletedUser,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

userRouter.put("/updateUser/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updatedUser = await userService.updateUser(id, req.body);
    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

userRouter.put("/updateProfile/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updatedProfile = await userService.updateProfile(id, req.body);
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedProfile,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

userRouter.patch("/changePassword/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const newPassword = req.body.newPassword;
    const updatedUser = await userService.changePassword(id, newPassword);
    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
      data: updatedUser,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

userRouter.post("/resetPassword", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required",
      });
    }

    const result = await userService.resetPassword(email, newPassword);

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// 2FA Routes
userRouter.get("/two-factor-status/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const result = await userService.getTwoFactorStatus(userId);
    return res.status(200).json({
      success: true,
      message: "2FA status retrieved successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

userRouter.patch("/toggle-two-factor/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Enabled field must be a boolean",
      });
    }

    const result = await userService.toggleTwoFactor(userId, enabled);
    return res.status(200).json({
      success: true,
      message: `2FA ${enabled ? "enabled" : "disabled"} successfully`,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = userRouter;
