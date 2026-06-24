const express = require("express");
const { authenticateToken } = require("../Middlewares/authMiddleware");
const userRouter = express.Router();
const userService = require("./user-service");
const { emitEvent, getOnlineUsers } = require("../Middlewares/socketio");
const activityLogService = require("../ActivityLogs/activity-log-service");
const { profileUpload } = require("../Middlewares/fileUpload");

userRouter.get("/online-users", async (req, res) => {
  try {
    const online = getOnlineUsers();
    return res.status(200).json({
      success: true,
      message: "Online users fetched successfully",
      data: online,
      count: online.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get online users",
    });
  }
});

// Self-registration endpoint - User enters email, receives temp password
userRouter.post("/self-register", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Call self-register service
    const result = await userService.selfRegister(email);

    // Log self-registration
    await activityLogService.logActivity(
      result.user.id,
      "User self-registered"
    );

    return res.status(201).json({
      success: true,
      message:
        "Registration successful! Check your email for temporary password.",
      data: {
        email: result.user.email,
        message: "Temporary password sent to your email",
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

userRouter.post(
  "/register",
  authenticateToken,
  profileUpload.single("profilePicture"),
  async (req, res) => {
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
        adminUserId: adminUserIdRaw, // Pass the admin user ID who is creating the user
        officeId,
        schoolId,
        positionId,
      } = req.body;

      // Parse adminUserId if it exists (could be string from FormData)
      const adminUserId = adminUserIdRaw ? parseInt(adminUserIdRaw, 10) : null;

      // Validate request body
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({
          success: false,
          message: "All fields are required",
        });
      }

      // Get profile picture path if file was uploaded
      let profilePicturePath = null;
      if (req.file) {
        profilePicturePath = req.file.path;
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
        officeId: officeId || null,
        schoolId: schoolId || null,
        positionId: positionId || null,
        profilePicture: profilePicturePath,
      });

      // Log user creation
      if (adminUserId) {
        await activityLogService.logUserCreated(adminUserId, email);
      } else {
        await activityLogService.logActivity(
          result.user.id,
          "User self-registered"
        );
      }

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
  }
);

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

    // Log successful login
    await activityLogService.logLogin(result.user.id, result.user.email);

    // Set HTTP-only cookie
    res.cookie("lrms-token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    // Log failed login attempt
    if (req.body.email) {
      await activityLogService.logFailedLogin(req.body.email);
    }
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

    // Log successful login after OTP verification
    await activityLogService.logLogin(result.user.id, result.user.email);

    // Set HTTP-only cookie
    res.cookie("lrms-token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
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
    // Get adminUserId from query parameter (DELETE requests don't typically have body)
    const adminUserId = req.query.adminUserId
      ? parseInt(req.query.adminUserId, 10)
      : null;

    // Get user info before deletion
    const userToDelete = await userService.userProfile(id);

    const deletedUser = await userService.deleteUser(id);

    // Log user deletion
    if (adminUserId) {
      await activityLogService.logUserDeleted(adminUserId, userToDelete.email);
    }

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
    const { adminUserId, ...updateData } = req.body;

    const updatedUser = await userService.updateUser(id, updateData);

    // Log user update
    if (adminUserId) {
      await activityLogService.logUserUpdated(adminUserId, updatedUser.email);
    }

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

userRouter.put(
  "/updateProfile/:id",
  authenticateToken,
  profileUpload.single("profilePicture"),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);

      // Get profile picture path if file was uploaded
      let profilePicturePath = null;
      if (req.file) {
        profilePicturePath = req.file.path;
      }

      // Merge profile picture path into request body if file was uploaded
      const profileData = req.file
        ? { ...req.body, profilePicture: profilePicturePath }
        : req.body;

      const updatedProfile = await userService.updateProfile(id, profileData);

      // Log profile update
      await activityLogService.logProfileUpdated(id);

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
  }
);

userRouter.patch("/changePassword/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const newPassword = req.body.newPassword;
    const updatedUser = await userService.changePassword(id, newPassword);

    // Log password change
    await activityLogService.logPasswordChanged(id);

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
    const { email, newPassword, adminUserId } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required",
      });
    }

    const result = await userService.resetPassword(email, newPassword);

    // Log password reset by admin
    if (adminUserId) {
      await activityLogService.logPasswordReset(adminUserId, email);
    }

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

    // Log 2FA toggle
    await activityLogService.logTwoFactorToggle(userId, enabled);

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

// Token verification route
userRouter.get("/verify", authenticateToken, async (req, res) => {
  try {
    // req.user is attached by authenticateToken middleware
    const user = await userService.getUserById(req.user.userId);
    
    // Refresh cookie on every verification to extend session
    const authHeader = req.headers["authorization"];
    const token = (authHeader && authHeader.split(" ")[1]) || req.cookies["lrms-token"];

    if (token) {
      res.cookie("lrms-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Token is valid",
      data: {
        user: user,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to verify token",
    });
  }
});

// Logout route
userRouter.post("/logout", (req, res) => {
  res.clearCookie("lrms-token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

module.exports = userRouter;
