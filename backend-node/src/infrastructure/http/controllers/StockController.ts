import { Request, Response } from 'express';
import { CreateStockMovementUseCase } from '../../../application/use-cases/CreateStockMovementUseCase';
import { ListStockMovementsUseCase } from '../../../application/use-cases/ListStockMovementsUseCase';

export class StockController {
  constructor(
    private readonly createMovementUseCase: CreateStockMovementUseCase,
    private readonly listMovementsUseCase: ListStockMovementsUseCase
  ) {}

  async listMovements(req: Request, res: Response) {
    try {
      const skip = parseInt(req.query.skip as string) || 0;
      const limit = parseInt(req.query.limit as string) || 50;
      const companyId = req.current_user.company_id;

      const movements = await this.listMovementsUseCase.execute(companyId, skip, limit);
      res.json(movements);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async createMovement(req: Request, res: Response) {
    try {
      const { product_id, movement_type, quantity, notes, installation_id } = req.body;
      const companyId = req.current_user.company_id;
      const createdBy = req.current_user.id;

      const movement = await this.createMovementUseCase.execute({
        companyId,
        productId: product_id,
        installationId: installation_id,
        movementType: movement_type,
        quantity,
        notes,
        createdBy,
      });

      res.status(201).json(movement);
    } catch (error: any) {
      if (error.message === 'PRODUCT_NOT_FOUND') {
        return res.status(404).json({ detail: 'Product not found' });
      }
      if (error.message === 'INSUFFICIENT_STOCK' || error.message === 'INVALID_MOVEMENT_TYPE') {
        return res.status(400).json({ detail: error.message });
      }
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }
}
