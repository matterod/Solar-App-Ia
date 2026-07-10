import { IPendingTaskRepository } from '../../domain/repositories/IPendingTaskRepository';
import { PendingTask, TaskPriority, TaskStatus, TaskType } from '../../domain/entities/PendingTask';

interface CreatePendingTaskDTO {
  companyId: string;
  installationId?: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assignedTo?: string;
  dueDate?: Date;
  taskType?: TaskType;
  isRecurring?: boolean;
  lastNotificationDaysBefore?: number;
  createdBy: string;
}

export class CreatePendingTaskUseCase {
  constructor(private readonly pendingTaskRepository: IPendingTaskRepository) {}

  async execute(data: CreatePendingTaskDTO): Promise<PendingTask> {
    return this.pendingTaskRepository.create({
      companyId: data.companyId,
      installationId: data.installationId || null,
      title: data.title,
      description: data.description || null,
      priority: data.priority || 'medium',
      status: data.status || 'pending',
      assignedTo: data.assignedTo || null,
      dueDate: data.dueDate || null,
      completedAt: null,
      taskType: data.taskType || null,
      isRecurring: data.isRecurring || false,
      lastNotificationDaysBefore: data.lastNotificationDaysBefore || null,
      createdBy: data.createdBy,
    });
  }
}

export class GetPendingTaskUseCase {
  constructor(private readonly pendingTaskRepository: IPendingTaskRepository) {}

  async execute(id: string, companyId: string): Promise<PendingTask> {
    const task = await this.pendingTaskRepository.findByIdAndCompany(id, companyId);
    if (!task) {
      throw new Error('PENDING_TASK_NOT_FOUND');
    }
    return task;
  }
}

interface UpdatePendingTaskDTO {
  id: string;
  companyId: string;
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assignedTo?: string;
  dueDate?: Date;
  isRecurring?: boolean;
}

export class UpdatePendingTaskUseCase {
  constructor(private readonly pendingTaskRepository: IPendingTaskRepository) {}

  async execute(data: UpdatePendingTaskDTO): Promise<PendingTask> {
    const { id, companyId, ...updateData } = data;
    
    // Automatically set completedAt if status changes to completed
    if (updateData.status === 'completed') {
      (updateData as any).completedAt = new Date();
    } else if (updateData.status) {
      (updateData as any).completedAt = null;
    }

    const updatedTask = await this.pendingTaskRepository.update(id, companyId, updateData);
    
    if (!updatedTask) {
      throw new Error('PENDING_TASK_NOT_FOUND');
    }
    
    return updatedTask;
  }
}

export class DeletePendingTaskUseCase {
  constructor(private readonly pendingTaskRepository: IPendingTaskRepository) {}

  async execute(id: string, companyId: string): Promise<void> {
    const deleted = await this.pendingTaskRepository.delete(id, companyId);
    if (!deleted) {
      throw new Error('PENDING_TASK_NOT_FOUND');
    }
  }
}

export class ListPendingTasksUseCase {
  constructor(private readonly pendingTaskRepository: IPendingTaskRepository) {}

  async execute(companyId: string, filters: any = {}, skip: number = 0, limit: number = 100): Promise<PendingTask[]> {
    return this.pendingTaskRepository.list(companyId, filters, skip, limit);
  }
}
