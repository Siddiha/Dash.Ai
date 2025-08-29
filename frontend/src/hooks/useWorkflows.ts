// frontend/crs / hooks / useWorkflows.ts;
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import toast from "react-hot-toast";

interface Workflow {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  trigger: any;
  steps: any[];
  executions: {
    total: number;
    successful: number;
    failed: number;
    lastRun?: string;
  };
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

  const createMutation = useMutation({
    mutationFn: async (workflowData: any) => {
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

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
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

  const deleteMutation = useMutation({
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

  const executeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/workflows/${id}/execute`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow executed successfully!");
    },
    onError: () => {
      toast.error("Failed to execute workflow");
    },
  });

  return {
    workflows,
    isLoading,
    error,
    createWorkflow: createMutation.mutate,
    updateWorkflow: updateMutation.mutate,
    deleteWorkflow: deleteMutation.mutate,
    executeWorkflow: executeMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isExecuting: executeMutation.isPending,
  };
}
