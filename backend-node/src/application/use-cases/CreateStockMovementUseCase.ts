import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { IStockMovementRepository } from '../../domain/repositories/IStockMovementRepository';
import { StockMovement, StockMovementType } from '../../domain/entities/StockMovement';

interface CreateStockMovementDTO {
  companyId: string;
  productId: string;
  installationId?: string;
  movementType: StockMovementType;
  quantity: number;
  notes?: string;
  createdBy: string;
}

export class CreateStockMovementUseCase {
  constructor(
    private readonly stockMovementRepository: IStockMovementRepository,
    private readonly productRepository: IProductRepository
  ) {}

  async execute(data: CreateStockMovementDTO): Promise<StockMovement> {
    const product = await this.productRepository.findByIdAndCompany(data.productId, data.companyId);
    
    if (!product) {
      throw new Error('PRODUCT_NOT_FOUND');
    }

    let newStock = Number(product.currentStock);
    const quantity = Number(data.quantity);

    if (data.movementType === 'incoming') {
      newStock += quantity;
    } else if (data.movementType === 'outgoing') {
      if (newStock < quantity) {
        throw new Error('INSUFFICIENT_STOCK');
      }
      newStock -= quantity;
    } else {
      throw new Error('INVALID_MOVEMENT_TYPE');
    }

    // Update Product Stock
    await this.productRepository.updateStock(product.id, newStock);

    // Create Stock Movement
    const movement = await this.stockMovementRepository.create({
      companyId: data.companyId,
      productId: data.productId,
      installationId: data.installationId || null,
      movementType: data.movementType,
      quantity: quantity,
      notes: data.notes || null,
      createdBy: data.createdBy,
    });

    return movement;
  }
}
