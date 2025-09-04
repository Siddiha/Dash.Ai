import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";//thses are the somthing u needs to downlaod and use it 
import { PrismaClient } from "@prisma/client";
import authRouter from "./routes/auth.routes";
import chatRouter from "./routes/chat.routes";
import integrationRouter from "./routes/integration.routes";
import workflowRouter from "./routes/workflow.routes";
import { errorHandler } from "./middleware/error.middleware";
import { WorkflowEngine } from "./services/workflow.service";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  },
});

export const prisma = new PrismaClient();
export const workflowEngine = new WorkflowEngine();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/chat", chatRouter);
app.use("/api/integrations", integrationRouter);
app.use("/api/workflows", workflowRouter);

// Socket.io connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_conversation", (conversationId) => {
    socket.join(`conversation:${conversationId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

