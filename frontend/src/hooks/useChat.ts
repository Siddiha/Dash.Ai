// frontend/src/hooks/useChat.ts
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import toast from "react-hot-toast";

interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
}

export function useChat() {
  const queryClient = useQueryClient();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const { data: sessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ["chat-sessions"],
    queryFn: async (): Promise<ChatSession[]> => {
      const response = await api.get("/chat/sessions");
      return response.data;
    },
  });

  const { data: currentSession, isLoading: isLoadingSession } = useQuery({
    queryKey: ["chat-session", currentSessionId],
    queryFn: async (): Promise<ChatSession | null> => {
      if (!currentSessionId) return null;
      const response = await api.get(`/chat/sessions/${currentSessionId}`);
      return response.data;
    },
    enabled: !!currentSessionId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({
      message,
      sessionId,
    }: {
      message: string;
      sessionId?: string;
    }) => {
      const response = await api.post("/chat/message", {
        message,
        sessionId,
      });
      return response.data;
    },
    onSuccess: (data: any) => {
      setCurrentSessionId(data.sessionId);
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      queryClient.invalidateQueries({
        queryKey: ["chat-session", data.sessionId],
      });
    },
    onError: () => {
      toast.error("Failed to send message");
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await api.delete(`/chat/sessions/${sessionId}`);
    },
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
      }
      toast.success("Chat session deleted");
    },
    onError: () => {
      toast.error("Failed to delete chat session");
    },
  });

  const sendMessage = useCallback(
    (message: string) => {
      return sendMessageMutation.mutate({
        message,
        sessionId: currentSessionId || undefined,
      });
    },
    [sendMessageMutation, currentSessionId]
  );

  return {
    sessions,
    currentSession,
    currentSessionId,
    setCurrentSessionId,
    isLoadingSessions,
    isLoadingSession,
    sendMessage,
    deleteSession: deleteSessionMutation.mutate,
    isSending: sendMessageMutation.isLoading,
    isDeleting: deleteSessionMutation.isLoading,
  };
}
