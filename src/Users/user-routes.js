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

    // Validate request body
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Call login service
    const result = await userService.login(email, password);

    emitEvent("user-just-logged-in", {
      email: result.user.email,
    });

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    // Return error response
    return res.status(401).json({
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

module.exports = userRouter;
