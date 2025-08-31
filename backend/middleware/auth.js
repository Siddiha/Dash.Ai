const authenticateSocket = (socket, next) => {
  // Mock authentication for socket connections
  socket.userId = 'mock-user-id';
  next();
};

module.exports = { authenticateSocket };
