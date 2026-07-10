export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskType = 'deadline' | 'recurring';

export interface PendingTask {
  id: string;
  installationId: string | null;
  companyId: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo: string | null;
  dueDate: Date | null;
  completedAt: Date | null;
  taskType: TaskType | null;
  isRecurring: boolean;
  lastNotificationDaysBefore: number | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}
