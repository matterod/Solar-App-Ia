import { PendingTask } from '../entities/PendingTask';

export interface IPendingTaskRepository {
  create(task: Omit<PendingTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<PendingTask>;
  findByIdAndCompany(id: string, companyId: string): Promise<PendingTask | null>;
  update(id: string, companyId: string, data: Partial<Omit<PendingTask, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>>): Promise<PendingTask | null>;
  delete(id: string, companyId: string): Promise<boolean>;
  list(companyId: string, filters: any, skip: number, limit: number): Promise<PendingTask[]>;
}
