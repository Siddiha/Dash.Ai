// frontend/src/hooks/useIntegrations.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, apiResponse } from "../services/api";
import { Integration, IntegrationType } from "../types/integrations";
import toast from "react-hot-toast";

export function useIntegrations() {
  const queryClient = useQueryClient();

  const {
    data: integrations,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["integrations"],
    queryFn: async (): Promise<Integration[]> => {
      const response = await api.get<Integration[]>("/integrations");
      return apiResponse(response);
    },
  });

  const connectIntegrationMutation = useMutation<
    { authUrl?: string; integration: Integration },
    Error,
    IntegrationType
  >({
    mutationFn: async (type: IntegrationType) => {
      const response = await api.post<{
        authUrl?: string;
        integration: Integration;
      }>("/integrations/connect", { type });
      return apiResponse(response);
    },
    onSuccess: (data: { authUrl?: string; integration: Integration }) => {
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

  const disconnectIntegrationMutation = useMutation<void, Error, string>({
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
