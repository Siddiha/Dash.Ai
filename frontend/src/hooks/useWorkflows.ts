// frontend/src/hooks/useWorkflows.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, apiResponse } from "../services/api";
import { Workflow, CreateWorkflowRequest, UpdateWorkflowRequest } from "../types/workflow";
import toast from "react-hot-toast";

export function useWorkflows() {
  const queryClient = useQueryClient();

  const {
    data: workflows,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["workflows"],
    queryFn: async (): Promise<Workflow[]> => {
      const response = await api.get<Workflow[]>("/workflows");
      return apiResponse(response);
    },
  });

  const createWorkflowMutation = useMutation<
    Workflow,
    Error,
    CreateWorkflowRequest
  >({
    mutationFn: async (workflowData: CreateWorkflowRequest) => {
      const response = await api.post<Workflow>("/workflows", workflowData);
      return apiResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow created successfully!");
    },
    onError: () => {
      toast.error("Failed to create workflow");
    },
  });

  const updateWorkflowMutation = useMutation<
    Workflow,
    Error,
    { id: string; data: UpdateWorkflowRequest }
  >({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateWorkflowRequest;
    }) => {
      const response = await api.patch<Workflow>(`/workflows/${id}`, data);
      return apiResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update workflow");
    },
  });

  const deleteWorkflowMutation = useMutation<
    void,
    Error,
    string
  >({
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
