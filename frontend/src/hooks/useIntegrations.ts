// frontend/src/hooks/useIntegrations.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import toast from "react-hot-toast";

interface Integration {
  id: string;
  type: string;
  name: string;
  isConnected: boolean;
  lastSync?: string;
}

export function useIntegrations() {
  const queryClient = useQueryClient();

  const {
    data: integrations,
    isLoading,
    error,
  } = useQuery<Integration[]>({
    queryKey: ["integrations"],
    queryFn: async () => {
      const response = await api.get("/integrations");
      return response.data;
    },
  });

  const connectMutation = useMutation({
    mutationFn: async (type: string) => {
      const response = await api.post(`/integrations/${type}/connect`);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        queryClient.invalidateQueries({ queryKey: ["integrations"] });
        toast.success("Integration connected successfully!");
      }
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || "Failed to connect integration"
      );
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/integrations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast.success("Integration disconnected successfully!");
    },
    onError: () => {
      toast.error("Failed to disconnect integration");
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/integrations/${id}/sync`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast.success("Integration synced successfully!");
    },
    onError: () => {
      toast.error("Failed to sync integration");
    },
  });

  return {
    integrations,
    isLoading,
    error,
    connectIntegration: connectMutation.mutate,
    disconnectIntegration: disconnectMutation.mutate,
    syncIntegration: syncMutation.mutate,
    isConnecting: connectMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
    isSyncing: syncMutation.isPending,
  };
}
