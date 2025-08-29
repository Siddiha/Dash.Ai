// backend/src/sockets/chat.socket.ts
import { Server, Socket } from "socket.io";

export function setupChatSockets(io: Server) {
  const chatNamespace = io.of("/chat");

  chatNamespace.on("connection", (socket: Socket) => {
    console.log("User connected to chat:", socket.id);

    socket.on("join-room", (userId: string) => {
      socket.join(`user-${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    socket.on("typing", (data) => {
      socket.to(`user-${data.userId}`).emit("user-typing", data);
    });

    socket.on("stop-typing", (data) => {
      socket.to(`user-${data.userId}`).emit("user-stop-typing", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected from chat:", socket.id);
    });
  });
}


