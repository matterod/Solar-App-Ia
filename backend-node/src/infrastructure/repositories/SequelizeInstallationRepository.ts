import { Op } from 'sequelize';
import { Installation } from '../../domain/entities/Installation';
import { IInstallationRepository } from '../../domain/repositories/IInstallationRepository';
import { InstallationModel } from '../database/models/InstallationModel';

export class SequelizeInstallationRepository implements IInstallationRepository {
  async create(installation: Omit<Installation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Installation> {
    const newInst = await InstallationModel.create(installation as any);
    return newInst.toJSON() as Installation;
  }

  async findByIdAndCompany(id: string, companyId: string): Promise<Installation | null> {
    const inst = await InstallationModel.findOne({
      where: { id, companyId },
      // Later we will include related models here if needed. For now, simple fetch.
    });
    return inst ? inst.toJSON() as Installation : null;
  }

  async update(id: string, companyId: string, data: Partial<Omit<Installation, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>>): Promise<Installation | null> {
    const [updatedRows] = await InstallationModel.update(data, {
      where: { id, companyId },
    });
    
    if (updatedRows === 0) return null;
    return this.findByIdAndCompany(id, companyId);
  }

  async delete(id: string, companyId: string): Promise<boolean> {
    const deletedRows = await InstallationModel.destroy({
      where: { id, companyId },
    });
    return deletedRows > 0;
  }

  async list(companyId: string, filters: any, skip: number, limit: number): Promise<Installation[]> {
    const whereClause: any = { companyId };
    
    if (filters.status) {
      whereClause.status = filters.status;
    }
    if (filters.search) {
      whereClause.locationName = { [Op.iLike]: `%${filters.search}%` };
    }
    if (filters.clientId) {
      whereClause.clientId = filters.clientId;
    }

    const installations = await InstallationModel.findAll({
      where: whereClause,
      limit,
      offset: skip,
      order: [['createdAt', 'DESC']],
    });
    return installations.map((i: any) => i.toJSON() as Installation);
  }
}
