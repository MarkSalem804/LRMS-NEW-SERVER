const { Server } = require("socket.io");
// const { version, patchNotes } = require("../../versioncontrols/version");

let io;
const onlineUsers = new Map(); // socket.id -> username (or some identifier)

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "https://ilearn-beta.depedimuscity.com",
    },
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Send version info to the connected client
    socket.emit("version-info", { version, patchNotes });

    // Receive username (or other data) from the client
    socket.on("user-online", (data) => {
      const { email } = data;
      onlineUsers.set(socket.id, email || "Anonymous");

      // Emit updated list to all clients
      io.emit("online-users", Array.from(onlineUsers.values()));
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
      onlineUsers.delete(socket.id);
      io.emit("online-users", Array.from(onlineUsers.values()));
    });
  });
};

// Emit events from other parts of the app
const emitEvent = (eventName, data) => {
  if (io) {
    io.emit(eventName, data);
  }
};

module.exports = { initSocket, emitEvent, onlineUsers };
