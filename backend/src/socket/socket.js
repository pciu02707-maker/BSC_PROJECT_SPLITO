/**
 * SPLITO REAL-TIME SOCKET LAYER
 * ──────────────────────────────────────────────────────────────────────────────
 * Events emitted by server:
 *   expense:added     → new expense added
 *   expense:updated   → expense edited
 *   expense:deleted   → expense removed
 *   balance:updated   → balance recalculated
 *   activity:new      → new activity log entry
 *   member:joined     → someone joined the trip
 *   member:left       → someone left the trip
 *   trip:closed       → host closed the trip
 *   trip:locked       → host locked the trip
 */

function initSocket(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join a trip room (client calls this when entering a trip page)
    socket.on('join:trip', (tripId) => {
      socket.join(`trip:${tripId}`);
      console.log(`👤 Socket ${socket.id} joined trip room: ${tripId}`);
    });

    // Leave a trip room
    socket.on('leave:trip', (tripId) => {
      socket.leave(`trip:${tripId}`);
      console.log(`👤 Socket ${socket.id} left trip room: ${tripId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
}

/**
 * Emit an event to all members of a trip room
 * @param {Object} io - socket.io server instance
 * @param {String} tripId
 * @param {String} event - event name
 * @param {Object} data - payload
 */
function emitToTrip(io, tripId, event, data) {
  io.to(`trip:${tripId}`).emit(event, data);
}

module.exports = { initSocket, emitToTrip };
