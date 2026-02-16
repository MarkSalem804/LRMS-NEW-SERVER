const jwt = require("jsonwebtoken");

// JWT secret key - must match the one in user-service.js
const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

/**
 * Authentication Middleware
 *
 * This middleware verifies JWT tokens from the Authorization header.
 * It extracts the token, verifies it, and attaches user info to the request object.
 *
 * Usage in routes:
 *   router.get("/protected-route", authenticateToken, (req, res) => {
 *     // req.user contains { userId, email, role }
 *     res.json({ message: "Protected data", user: req.user });
 *   });
 */
const authenticateToken = (req, res, next) => {
  // Get token from Authorization header
  // Format: "Bearer <token>"
  const authHeader = req.headers["authorization"];

  // Debug logging
  console.log("🔍 [Auth Middleware] Request received");
  console.log("🔍 [Auth Middleware] Request path:", req.path);
  console.log("🔍 [Auth Middleware] Request method:", req.method);
  console.log(
    "🔍 [Auth Middleware] Authorization header:",
    authHeader ? "Header exists" : "No header"
  );
  console.log("🔍 [Auth Middleware] All headers:", Object.keys(req.headers));

  const tokenHeader = authHeader && authHeader.split(" ")[1];
  const token = tokenHeader || req.cookies["lrms-token"];

  console.log(
    "🔍 [Auth Middleware] Extracted token:",
    token ? "Token exists" : "No token"
  );

  // If no token provided, return 401 Unauthorized
  if (!token) {
    console.warn("⚠️ [Auth Middleware] No token provided - returning 401");
    return res.status(401).json({
      success: false,
      message: "Access token required. Please log in.",
    });
  }

  // Verify the token
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    // If token is invalid or expired, return 403 Forbidden
    if (err) {
      console.error(
        "❌ [Auth Middleware] Token verification failed:",
        err.message
      );
      return res.status(403).json({
        success: false,
        message: "Invalid or expired token. Please log in again.",
      });
    }

    // Token is valid - attach user info to request object
    // decoded contains: { userId, email, role, iat, exp }
    console.log("✅ [Auth Middleware] Token verified successfully");
    console.log("🔍 [Auth Middleware] User ID:", decoded.userId);
    console.log("🔍 [Auth Middleware] User Email:", decoded.email);
    console.log("🔍 [Auth Middleware] User Role:", decoded.role);

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    // Continue to the next middleware or route handler
    next();
  });
};

/**
 * Optional Role-Based Access Control Middleware
 *
 * This middleware checks if the user has the required role(s).
 * Use after authenticateToken middleware.
 *
 * Usage:
 *   router.get("/admin-only",
 *     authenticateToken,
 *     requireRole(["ADMIN"]),
 *     (req, res) => { ... }
 *   );
 *
 * @param {Array<String>} allowedRoles - Array of roles that can access the route
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    // authenticateToken must be used before this middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // Check if user's role is in the allowed roles list
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions.",
      });
    }

    // User has required role - continue
    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
};
