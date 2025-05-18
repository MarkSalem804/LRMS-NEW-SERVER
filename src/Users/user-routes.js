const express = require("express");
const userRouter = express.Router();
const userService = require("./user-service");

userRouter.post("/register", async (req, res) => {
  console.log("[user-routes] /register endpoint hit");
  console.log("[user-routes] Request body:", req.body);
  try {
    const { email, password, firstName, lastName, role } = req.body;

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
      role,
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

module.exports = userRouter;
