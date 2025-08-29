// backend/src/sockets/notifications.socket.ts
import { Server, Socket } from "socket.io";

export function setupNotificationSockets(io: Server) {
  const notificationNamespace = io.of("/notifications");

  notificationNamespace.on("connection", (socket: Socket) => {
    console.log("User connected to notifications:", socket.id);

    socket.on("join-user", (userId: string) => {
      socket.join(`user-${userId}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected from notifications:", socket.id);
    });
  });

  return {
    sendNotification: (userId: string, notification: any) => {
      notificationNamespace
        .to(`user-${userId}`)
        .emit("notification", notification);
    },
  };
}



