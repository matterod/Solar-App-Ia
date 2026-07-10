import { Op } from 'sequelize';
import { PendingTask } from '../../domain/entities/PendingTask';
import { IPendingTaskRepository } from '../../domain/repositories/IPendingTaskRepository';
import { PendingTaskModel } from '../database/models/PendingTaskModel';
import { InstallationModel } from '../database/models/InstallationModel';
import { UserModel } from '../database/models/UserModel';

export class SequelizePendingTaskRepository implements IPendingTaskRepository {
  async create(task: Omit<PendingTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<PendingTask> {
    const newTask = await PendingTaskModel.create(task as any);
    return newTask.toJSON() as PendingTask;
  }

  async findByIdAndCompany(id: string, companyId: string): Promise<PendingTask | null> {
    const task = await PendingTaskModel.findOne({
      where: { id, companyId },
    });
    return task ? task.toJSON() as PendingTask : null;
  }

  async update(id: string, companyId: string, data: Partial<Omit<PendingTask, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>>): Promise<PendingTask | null> {
    const [updatedRows] = await PendingTaskModel.update(data, {
      where: { id, companyId },
    });
    
    if (updatedRows === 0) return null;
    return this.findByIdAndCompany(id, companyId);
  }

  async delete(id: string, companyId: string): Promise<boolean> {
    const deletedRows = await PendingTaskModel.destroy({
      where: { id, companyId },
    });
    return deletedRows > 0;
  }

  async list(companyId: string, filters: any, skip: number, limit: number): Promise<PendingTask[]> {
    const whereClause: any = { companyId };
    
    if (filters.status) {
      whereClause.status = filters.status;
    }
    if (filters.priority) {
      whereClause.priority = filters.priority;
    }
    if (filters.installationId) {
      whereClause.installationId = filters.installationId;
    }
    if (filters.assignedTo) {
      whereClause.assignedTo = filters.assignedTo;
    }

    const tasks = await PendingTaskModel.findAll({
      where: whereClause,
      limit,
      offset: skip,
      order: [['dueDate', 'ASC'], ['priority', 'DESC']],
      include: [
        { model: InstallationModel, as: 'installation', attributes: ['locationName'] },
        { model: UserModel, as: 'assignee', attributes: ['name', 'email'] }
      ]
    });
    
    return tasks.map(t => {
      const json = t.toJSON() as any;
      return {
        ...json,
        installationName: json.installation?.locationName || null,
        assignedToName: json.assignee?.name || null,
      } as PendingTask;
    });
  }
}
