// frontend/src/hooks/useWorkflows.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import toast from "react-hot-toast";

interface Workflow {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  trigger: {
    type: string;
    integration: string;
    conditions: any;
  };
  steps: Array<{
    id: string;
    integrationId: string;
    action: string;
    parameters: any;
  }>;
  executions: {
    total: number;
    successful: number;
    failed: number;
    lastRun?: string;
  };
  createdAt: string;
}

export function useWorkflows() {
  const queryClient = useQueryClient();

  const {
    data: workflows,
    isLoading,
    error,
  } = useQuery<Workflow[]>({
    queryKey: ["workflows"],
    queryFn: async () => {
      const response = await api.get("/workflows");
      return response.data;
    },
  });

  const createWorkflowMutation = useMutation({
    mutationFn: async (workflowData: Partial<Workflow>) => {
      const response = await api.post("/workflows", workflowData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow created successfully!");
    },
    onError: () => {
      toast.error("Failed to create workflow");
    },
  });

  const updateWorkflowMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Workflow>;
    }) => {
      const response = await api.patch(`/workflows/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update workflow");
    },
  });

  const deleteWorkflowMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/workflows/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete workflow");
    },
  });

  return {
    workflows,
    isLoading,
    error,
    createWorkflow: createWorkflowMutation.mutate,
    updateWorkflow: updateWorkflowMutation.mutate,
    deleteWorkflow: deleteWorkflowMutation.mutate,
    isCreating: createWorkflowMutation.isLoading,
    isUpdating: updateWorkflowMutation.isLoading,
    isDeleting: deleteWorkflowMutation.isLoading,
  };
}
