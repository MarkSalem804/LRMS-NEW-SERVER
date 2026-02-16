const express = require("express");
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const https = require("https");
const http = require("http");
const cookieParser = require("cookie-parser");
const Routes = require("./src/Middlewares/routes-conf");
const clear = require("clear");
const dotenv = require("dotenv");
const cors = require("cors");
const { initSocket } = require("./src/Middlewares/socketio");

dotenv.config();

const app = express();
const corsOptions = require("./src/Middlewares/CORS-conf/cors-options");
const credentials = require("./src/Middlewares/CORS-conf/credentials");
const prisma = new PrismaClient();
// const port = process.env.PORT || 5001;
const port = process.env.PORT || 5005;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from uploads directory
app.use("/uploads", express.static("uploads"));

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

// 500 Internal Server Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

const options = {
  key: fs.readFileSync(
    "/etc/letsencrypt/live/sdoic-ilearn.depedimuscity.com/privkey.pem"
  ),
  cert: fs.readFileSync(
    "/etc/letsencrypt/live/sdoic-ilearn.depedimuscity.com/fullchain.pem"
  ),
};

const server = https.createServer(options, app);

initSocket(server);

server.listen(port, () => {
  clear(); // Clear the terminal when the server starts
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

// Create HTTP server for Socket.io
// const server = http.createServer(app);

// Initialize Socket.io
// initSocket(server);

// server.listen(port, () => {
  // clear(); // Clear the terminal when the server starts
  // console.log(`🚀 Server running on port ${port}`);
  // console.log(`🔌 Socket.io initialized and ready`);
// });

module.exports = { prisma };
