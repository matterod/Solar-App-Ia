import { Op } from 'sequelize';
import { Maintenance } from '../../domain/entities/Maintenance';
import { IMaintenanceRepository } from '../../domain/repositories/IMaintenanceRepository';
import { MaintenanceModel } from '../database/models/MaintenanceModel';

export class SequelizeMaintenanceRepository implements IMaintenanceRepository {
  async create(maintenance: Omit<Maintenance, 'id' | 'createdAt' | 'updatedAt'>): Promise<Maintenance> {
    const newMaint = await MaintenanceModel.create(maintenance as any);
    return newMaint.toJSON() as Maintenance;
  }

  async findByIdAndCompany(id: string, companyId: string): Promise<Maintenance | null> {
    const maint = await MaintenanceModel.findOne({
      where: { id, companyId },
    });
    return maint ? maint.toJSON() as Maintenance : null;
  }

  async update(id: string, companyId: string, data: Partial<Omit<Maintenance, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>>): Promise<Maintenance | null> {
    const [updatedRows] = await MaintenanceModel.update(data, {
      where: { id, companyId },
    });
    
    if (updatedRows === 0) return null;
    return this.findByIdAndCompany(id, companyId);
  }

  async delete(id: string, companyId: string): Promise<boolean> {
    const deletedRows = await MaintenanceModel.destroy({
      where: { id, companyId },
    });
    return deletedRows > 0;
  }

  async list(companyId: string, filters: any, skip: number, limit: number): Promise<Maintenance[]> {
    const whereClause: any = { companyId };
    
    if (filters.installationId) {
      whereClause.installationId = filters.installationId;
    }
    if (filters.status) {
      whereClause.status = filters.status;
    }
    if (filters.upcomingDays) {
      const today = new Date();
      const end = new Date();
      end.setDate(today.getDate() + parseInt(filters.upcomingDays, 10));

      whereClause.scheduledDate = {
        [Op.gte]: today,
        [Op.lte]: end,
      };
      whereClause.status = 'scheduled';
    }

    const maintenances = await MaintenanceModel.findAll({
      where: whereClause,
      limit,
      offset: skip,
      order: [['scheduledDate', 'ASC']],
    });
    return maintenances.map((m: any) => m.toJSON() as Maintenance);
  }
}
