// backend/src/sockets/workflow.socket.ts
import { Server, Socket } from "socket.io";

export function setupWorkflowSocket(io: Server) {
  const workflowNamespace = io.of("/workflows");

  workflowNamespace.on("connection", (socket: Socket) => {
    console.log("User connected to workflows:", socket.id);

    socket.on("join-workflow", (workflowId: string) => {
      socket.join(`workflow-${workflowId}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected from workflows:", socket.id);
    });
  });

  // Emit workflow execution updates
  return {
    emitExecutionUpdate: (workflowId: string, data: any) => {
      workflowNamespace
        .to(`workflow-${workflowId}`)
        .emit("execution-update", data);
    },
  };
}


