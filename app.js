const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
// const https = require("https");
const http = require("http");
const cookieParser = require("cookie-parser");
const Routes = require("./src/Middlewares/routes-conf");
const clear = require("clear");
const cors = require("cors");
const { initSocket } = require("./src/Middlewares/socketio");

const app = express();
app.set("trust proxy", 1);
const corsOptions = require("./src/Middlewares/CORS-conf/cors-options");
const credentials = require("./src/Middlewares/CORS-conf/credentials");
const prisma = new PrismaClient();
// const port = process.env.PORT || 5001;
const port = process.env.PORT || 5201;
// const port = process.env.PORT || 5005;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Global path resolution for storage
const path = require("path");
const UPLOAD_ROOT = process.env.UPLOAD_ROOT || "uploads";
const PROFILE_ROOT = process.env.PROFILE_ROOT || path.join(UPLOAD_ROOT, "profiles");
const absoluteUploadPath = path.resolve(UPLOAD_ROOT);
const absoluteProfilePath = path.resolve(PROFILE_ROOT);

// Serve static files from configured storage directory
app.use("/uploads", express.static(absoluteUploadPath));
// Add static route for absolute profile paths in case they are used
app.use("/profiles", express.static(absoluteProfilePath));

// Middleware
app.use(credentials);
app.use(cors(corsOptions));

app.use((req, res, next) => {
  // req.prisma = prisma;
  next();
});

Routes(app, prisma);

app.use((req, res) => {
  res.status(404).send("Route not found");
});

// App error handler
app.use((err, req, res, next) => {
  // Handle Multer errors (File size, etc.)
  if (err && (err.name === "MulterError" || err.message.includes("Invalid file type"))) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

// const options = {
//   key: fs.readFileSync(
//     "/etc/letsencrypt/live/sdoic-ilearn.depedimuscity.com/privkey.pem"
//   ),
//   cert: fs.readFileSync(
//     "/etc/letsencrypt/live/sdoic-ilearn.depedimuscity.com/fullchain.pem"
//   ),
// };

// const server = https.createServer(options, app);

// initSocket(server);

// server.listen(port, () => {
//   clear(); // Clear the terminal when the server starts
//   console.log(`Server running on port ${port}`);
//   console.log(`Environment: ${process.env.NODE_ENV}`);
// });

// Create HTTP server for Socket.io
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

//server.listen(port, () => {
//  clear(); // Clear the terminal when the server starts
//  console.log(`🚀 Server running on port ${port}`);
//  console.log(`🔌 Socket.io initialized and ready`);
//});
server.listen(port, "127.0.0.1", () => {
  clear();

  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = { prisma };
