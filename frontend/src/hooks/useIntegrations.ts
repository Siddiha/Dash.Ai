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
  } = useQuery({
    queryKey: ["integrations"],
    queryFn: async (): Promise<Integration[]> => {
      const response = await api.get("/integrations");
      return response.data;
    },
  });

  const connectIntegrationMutation = useMutation({
    mutationFn: async (type: string) => {
      const response = await api.post("/integrations/connect", { type });
      return response.data;
    },
    onSuccess: (data: any) => {
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        queryClient.invalidateQueries({ queryKey: ["integrations"] });
        toast.success("Integration connected successfully!");
      }
    },
    onError: () => {
      toast.error("Failed to connect integration");
    },
  });

  const disconnectIntegrationMutation = useMutation({
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

  return {
    integrations,
    isLoading,
    error,
    connectIntegration: connectIntegrationMutation.mutate,
    disconnectIntegration: disconnectIntegrationMutation.mutate,
    isConnecting: connectIntegrationMutation.isLoading,
    isDisconnecting: disconnectIntegrationMutation.isLoading,
  };
}
