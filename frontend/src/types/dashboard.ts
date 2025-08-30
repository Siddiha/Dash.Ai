export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  completedAt?: string;
  source?: string;
  sourceId?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  tasks: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
  emails: {
    unread: number;
    total: number;
    recent: Array<{
      id: string;
      subject: string;
      from: string;
      date: string;
      snippet: string;
    }>;
  };
  calendar: {
    upcomingEvents: Array<{
      id: string;
      summary: string;
      start: string;
      end: string;
    }>;
    todayEvents: number;
  };
  integrations: {
    connected: number;
    total: number;
    status: Array<{
      type: string;
      name: string;
      isConnected: boolean;
      lastSync: string;
    }>;
  };
}
