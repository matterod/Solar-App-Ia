import { Cost } from '../../domain/entities/Cost';
import { ICostRepository } from '../../domain/repositories/ICostRepository';
import { CostModel } from '../database/models/CostModel';

export class SequelizeCostRepository implements ICostRepository {
  async create(cost: Omit<Cost, 'id' | 'createdAt'>): Promise<Cost> {
    const newCost = await CostModel.create(cost as any);
    return newCost.toJSON() as Cost;
  }

  async findByIdAndCompany(id: string, companyId: string): Promise<Cost | null> {
    const cost = await CostModel.findOne({
      where: { id, companyId },
    });
    return cost ? cost.toJSON() as Cost : null;
  }

  async update(id: string, companyId: string, data: Partial<Omit<Cost, 'id' | 'companyId' | 'createdAt'>>): Promise<Cost | null> {
    const [updatedRows] = await CostModel.update(data, {
      where: { id, companyId },
    });
    
    if (updatedRows === 0) return null;
    return this.findByIdAndCompany(id, companyId);
  }

  async delete(id: string, companyId: string): Promise<boolean> {
    const deletedRows = await CostModel.destroy({
      where: { id, companyId },
    });
    return deletedRows > 0;
  }

  async list(companyId: string, filters: any, skip: number, limit: number): Promise<Cost[]> {
    const whereClause: any = { companyId };
    
    if (filters.installationId) {
      whereClause.installationId = filters.installationId;
    }

    const costs = await CostModel.findAll({
      where: whereClause,
      limit,
      offset: skip,
      order: [['costDate', 'DESC'], ['createdAt', 'DESC']],
    });
    return costs.map((c: any) => c.toJSON() as Cost);
  }
}
