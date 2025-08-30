export type ExecutionStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface WorkflowStep {
  id: string;
  workflowId: string;
  integrationId: string;
  stepOrder: number;
  action: string;
  parameters: any;
  createdAt: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  startedAt: string;
  completedAt?: string;
  error?: string;
  logs?: any;
}

export interface Workflow {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isActive: boolean;
  trigger: any;
  createdAt: string;
  updatedAt: string;
  steps: WorkflowStep[];
  executions: WorkflowExecution[];
}

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  trigger: any;
  steps: Omit<WorkflowStep, 'id' | 'workflowId' | 'createdAt'>[];
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
  trigger?: any;
  steps?: Omit<WorkflowStep, 'id' | 'workflowId' | 'createdAt'>[];
}



