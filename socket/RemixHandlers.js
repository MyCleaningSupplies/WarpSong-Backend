const RemixSession = require('../models/RemixSession');

const remixHandlers = (io) => {
  // Track active sessions and users
  const sessions = new Map();

  io.on('connection', (socket) => {
    console.log('⚡ User connected:', socket.id);

// In your server-side socket.io code (RemixHandlers.js)
socket.on('user-ready', ({ sessionCode, userId }) => {
  // Emit to all clients in the room, including the sender
  io.to(sessionCode).emit('user-ready', { userId });
  console.log(`User ${userId} is ready in session ${sessionCode}`);
});




    // Join session handler
    socket.on('join-session', async ({ sessionCode, userId }) => {
      try {
        socket.join(sessionCode);
        sessions.set(socket.id, sessionCode);
    
        // Fetch the user's stems
        const userStems = await RemixSession.findOne({ sessionCode }).populate("stems.stem");
        if (userStems) {
          // Emit the stems to all users in the session
          io.to(sessionCode).emit('update-stems', { stems: userStems.stems });
        }
    
        // Notify others in the session
        socket.to(sessionCode).emit('user-joined', { userId });
        console.log(`User ${userId} joined session: ${sessionCode}`);
        
        // Sync the playback state for the new user
        const sessionState = sessions.get(sessionCode) || {};
        if (sessionState.isPlaying) {
          // Give the client a moment to initialize before sending playback state
          setTimeout(() => {
            socket.emit('sync-playback', true);
          }, 2000);
        }
      } catch (error) {
        console.error('Join session error:', error);
        socket.emit('error', { message: 'Failed to join session' });
      }
    });
    

    // Playback control handler
    socket.on('playback-control', ({ sessionCode, isPlaying }) => {
      console.log(`🎵 Playback ${isPlaying ? 'started' : 'stopped'} in session ${sessionCode}`);
      
      // Store the session's playback state
      const sessionState = sessions.get(sessionCode) || {};
      sessionState.isPlaying = isPlaying;
      sessions.set(sessionCode, sessionState);
      
      // Broadcast to all clients in the session
      socket.to(sessionCode).emit('sync-playback', isPlaying);
    });

    // Stem selection handler
    socket.on('select-stem', ({ sessionCode, stemId, stemType, userId, stem }) => {
      console.log(`User ${userId} selected stem ${stemId} in session ${sessionCode}`);
      const normalizedStemId = stemId.trim().toLowerCase(); // Normalize on the server
      io.to(sessionCode).emit('stem-selected', { userId, stemId: normalizedStemId, stemType, stem });
    });
    
    
    

    // BPM change handler
    socket.on('bpm-change', ({ sessionCode, bpm }) => {
      console.log(`🎵 BPM changed to ${bpm} in session ${sessionCode}`);
      io.in(sessionCode).emit('sync-bpm', bpm); // to all clients in session
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      const sessionCode = sessions.get(socket.id);
      if (sessionCode) {
        // Notify others that user has left session
        socket.to(sessionCode).emit('user-left', socket.id);
        sessions.delete(socket.id);
      }
      console.log('👋 User disconnected:', socket.id);
    });
  });
};

module.exports = remixHandlers;
