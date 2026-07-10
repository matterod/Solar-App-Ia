import { StockMovement } from '../../domain/entities/StockMovement';
import { IStockMovementRepository } from '../../domain/repositories/IStockMovementRepository';
import { StockMovementModel } from '../database/models/StockMovementModel';

export class SequelizeStockMovementRepository implements IStockMovementRepository {
  async create(movement: Omit<StockMovement, 'id' | 'createdAt'>): Promise<StockMovement> {
    const newMovement = await StockMovementModel.create(movement as any);
    return newMovement.toJSON() as StockMovement;
  }

  async findByCompany(companyId: string, limit: number, skip: number): Promise<StockMovement[]> {
    const movements = await StockMovementModel.findAll({
      where: { companyId },
      limit,
      offset: skip,
      order: [['createdAt', 'DESC']],
    });
    return movements.map((m: any) => m.toJSON() as StockMovement);
  }
}
