// frontend/src/hooks/useChat.ts
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, apiResponse } from "../services/api";
import { ChatSession, SendMessageRequest, SendMessageResponse } from "../types/chat";
import toast from "react-hot-toast";

export function useChat() {
  const queryClient = useQueryClient();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const { data: sessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ["chat-sessions"],
    queryFn: async (): Promise<ChatSession[]> => {
      const response = await api.get<ChatSession[]>("/chat/sessions");
      return apiResponse(response);
    },
  });

  const { data: currentSession, isLoading: isLoadingSession } = useQuery({
    queryKey: ["chat-session", currentSessionId],
    queryFn: async (): Promise<ChatSession | null> => {
      if (!currentSessionId) return null;
      const response = await api.get<ChatSession>(`/chat/sessions/${currentSessionId}`);
      return apiResponse(response);
    },
    enabled: !!currentSessionId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({
      message,
      sessionId,
    }: SendMessageRequest): Promise<SendMessageResponse> => {
      const response = await api.post<SendMessageResponse>("/chat/message", {
        message,
        sessionId,
      });
      return apiResponse(response);
    },
    onSuccess: (data: SendMessageResponse) => {
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
    onSuccess: (_: void, sessionId: string) => {
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
