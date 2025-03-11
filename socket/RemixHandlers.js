// remixHandlers.js
const sessions = new Map(); 
// Structure: { sessionCode: { users: [], readyUsers: [] } }

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("⚡ User connected:", socket.id);

    socket.on("join-session", ({ sessionCode, userId }) => {
      let sessionState = sessions.get(sessionCode);
      if (!sessionState) {
        sessionState = { users: [], readyUsers: [] };
        sessions.set(sessionCode, sessionState);
      }
      if (!sessionState.users.includes(userId)) {
        sessionState.users.push(userId);
      }
      socket.join(sessionCode);
      // Emit full user list
      io.to(sessionCode).emit("user-joined", {
        userId,
        users: sessionState.users,
      });
      console.log(`User ${userId} joined session ${sessionCode}`);
    });

    socket.on("leave-session", ({ sessionCode, userId }) => {
      let sessionState = sessions.get(sessionCode);
      if (sessionState) {
        sessionState.users = sessionState.users.filter((u) => u !== userId);
        sessionState.readyUsers = sessionState.readyUsers.filter((u) => u !== userId);
      }
      socket.leave(sessionCode);
      io.to(sessionCode).emit("user-left", {
        userId,
        users: sessionState ? sessionState.users : [],
      });
      console.log(`User ${userId} left session ${sessionCode}`);
    });

    socket.on("select-stem", ({ sessionCode, userId, stemId, stemType, stem }) => {
      console.log(`User ${userId} selected stem ${stemId} (${stemType}) in session ${sessionCode}`);
      // Broadcast the stem selection to all clients in the room
      io.to(sessionCode).emit("stem-selected", { userId, stemId, stemType, stem });
    });

    socket.on("user-ready", ({ sessionCode, userId }) => {
      let sessionState = sessions.get(sessionCode);
      if (sessionState && !sessionState.readyUsers.includes(userId)) {
        sessionState.readyUsers.push(userId);
      }
      // Emit updated ready users list
      io.to(sessionCode).emit("user-ready-update", {
        readyUsers: sessionState ? sessionState.readyUsers : [],
      });
      console.log(`User ${userId} is ready in session ${sessionCode}`);
    });

    socket.on("playback-control", ({ sessionCode, isPlaying }) => {
      console.log(`Playback ${isPlaying ? "started" : "stopped"} in session ${sessionCode}`);
      io.to(sessionCode).emit("sync-playback", { isPlaying });
    });

    socket.on("bpm-change", ({ sessionCode, bpm }) => {
      console.log(`BPM changed to ${bpm} in session ${sessionCode}`);
      io.to(sessionCode).emit("sync-bpm", bpm);
    });

    socket.on("disconnect", () => {
      console.log("👋 User disconnected:", socket.id);
      // Optionally, handle removal from sessions here if you can map socket.id to a session.
    });
  });
};