import { ICostRepository } from '../../domain/repositories/ICostRepository';
import { Cost, CostType } from '../../domain/entities/Cost';

interface CreateCostDTO {
  installationId: string;
  companyId: string;
  costType: CostType;
  description?: string;
  amount: number;
  quantity?: number;
  costDate?: Date;
  createdBy: string;
}

export class CreateCostUseCase {
  constructor(private readonly costRepository: ICostRepository) {}

  async execute(data: CreateCostDTO): Promise<Cost> {
    return this.costRepository.create({
      installationId: data.installationId,
      companyId: data.companyId,
      costType: data.costType,
      description: data.description || null,
      amount: data.amount,
      quantity: data.quantity || 1,
      costDate: data.costDate || new Date(),
      createdBy: data.createdBy,
    });
  }
}

export class GetCostUseCase {
  constructor(private readonly costRepository: ICostRepository) {}

  async execute(id: string, companyId: string): Promise<Cost> {
    const cost = await this.costRepository.findByIdAndCompany(id, companyId);
    if (!cost) {
      throw new Error('COST_NOT_FOUND');
    }
    return cost;
  }
}

interface UpdateCostDTO {
  id: string;
  companyId: string;
  costType?: CostType;
  description?: string;
  amount?: number;
  quantity?: number;
  costDate?: Date;
}

export class UpdateCostUseCase {
  constructor(private readonly costRepository: ICostRepository) {}

  async execute(data: UpdateCostDTO): Promise<Cost> {
    const { id, companyId, ...updateData } = data;
    const updatedCost = await this.costRepository.update(id, companyId, updateData);
    
    if (!updatedCost) {
      throw new Error('COST_NOT_FOUND');
    }
    
    return updatedCost;
  }
}

export class DeleteCostUseCase {
  constructor(private readonly costRepository: ICostRepository) {}

  async execute(id: string, companyId: string): Promise<void> {
    const deleted = await this.costRepository.delete(id, companyId);
    if (!deleted) {
      throw new Error('COST_NOT_FOUND');
    }
  }
}

export class ListCostsUseCase {
  constructor(private readonly costRepository: ICostRepository) {}

  async execute(companyId: string, filters: any = {}, skip: number = 0, limit: number = 100): Promise<Cost[]> {
    return this.costRepository.list(companyId, filters, skip, limit);
  }
}
