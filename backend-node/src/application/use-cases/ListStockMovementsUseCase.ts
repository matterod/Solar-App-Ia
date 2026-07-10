import { IStockMovementRepository } from '../../domain/repositories/IStockMovementRepository';
import { StockMovement } from '../../domain/entities/StockMovement';

export class ListStockMovementsUseCase {
  constructor(private readonly stockMovementRepository: IStockMovementRepository) {}

  async execute(companyId: string, skip: number = 0, limit: number = 50): Promise<StockMovement[]> {
    return this.stockMovementRepository.findByCompany(companyId, limit, skip);
  }
}
