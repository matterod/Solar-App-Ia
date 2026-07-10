import { Activity } from '../../domain/entities/Activity';
import { IActivityRepository } from '../../domain/repositories/IActivityRepository';
import { ActivityModel } from '../database/models/ActivityModel';

export class SequelizeActivityRepository implements IActivityRepository {
  async create(activity: Omit<Activity, 'id' | 'createdAt'>): Promise<Activity> {
    const newAct = await ActivityModel.create(activity as any);
    return newAct.toJSON() as Activity;
  }

  async findByIdAndCompany(id: string, companyId: string): Promise<Activity | null> {
    const act = await ActivityModel.findOne({
      where: { id, companyId },
    });
    return act ? act.toJSON() as Activity : null;
  }

  async update(id: string, companyId: string, data: Partial<Omit<Activity, 'id' | 'companyId' | 'createdAt'>>): Promise<Activity | null> {
    const [updatedRows] = await ActivityModel.update(data, {
      where: { id, companyId },
    });
    
    if (updatedRows === 0) return null;
    return this.findByIdAndCompany(id, companyId);
  }

  async delete(id: string, companyId: string): Promise<boolean> {
    const deletedRows = await ActivityModel.destroy({
      where: { id, companyId },
    });
    return deletedRows > 0;
  }

  async list(companyId: string, filters: any, skip: number, limit: number): Promise<Activity[]> {
    const whereClause: any = { companyId };
    
    if (filters.installationId) {
      whereClause.installationId = filters.installationId;
    }

    const activities = await ActivityModel.findAll({
      where: whereClause,
      limit,
      offset: skip,
      order: [['activityDate', 'DESC']],
    });
    return activities.map((a: any) => a.toJSON() as Activity);
  }
}
