const { Server } = require("socket.io");

let io;
const onlineUsers = new Map(); // socket.id -> { userId, email, firstName, lastName, role }

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5174",
        "https://sdoic-ilearn.depedimuscity.com",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`✅ Socket connected: ${socket.id}`);

    // Receive user data when they connect
    socket.on("user-online", (data) => {
      const { userId, email, firstName, lastName, role } = data;

      // Store full user info
      onlineUsers.set(socket.id, {
        userId,
        email,
        firstName,
        lastName,
        role,
        connectedAt: new Date(),
      });

      console.log(`👤 User online: ${email} (${socket.id})`);
      console.log(`📊 Total online users: ${onlineUsers.size}`);

      // Emit updated list to all clients
      const onlineList = Array.from(onlineUsers.values());
      io.emit("online-users-updated", onlineList);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      const user = onlineUsers.get(socket.id);
      if (user) {
        console.log(`❌ User offline: ${user.email} (${socket.id})`);
      }
      onlineUsers.delete(socket.id);
      console.log(`📊 Total online users: ${onlineUsers.size}`);

      // Emit updated list to all clients
      const onlineList = Array.from(onlineUsers.values());
      io.emit("online-users-updated", onlineList);
    });
  });

  return io;
};

// Get current online users (for HTTP endpoint)
const getOnlineUsers = () => {
  return Array.from(onlineUsers.values());
};

// Emit events from other parts of the app
const emitEvent = (eventName, data) => {
  if (io) {
    io.emit(eventName, data);
  }
};

module.exports = { initSocket, emitEvent, onlineUsers, getOnlineUsers };
