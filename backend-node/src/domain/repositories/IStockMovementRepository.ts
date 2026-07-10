import { StockMovement } from '../entities/StockMovement';

export interface IStockMovementRepository {
  create(movement: Omit<StockMovement, 'id' | 'createdAt'>): Promise<StockMovement>;
  findByCompany(companyId: string, limit: number, skip: number): Promise<StockMovement[]>;
}
