import { IBudgetRepository } from '../../domain/repositories/IBudgetRepository';
import { Budget, BudgetItem, BudgetStatus } from '../../domain/entities/Budget';

function calculateTotals(items: Omit<BudgetItem, 'id' | 'budgetId'>[], taxRate: number) {
  let subtotal = 0;
  items.forEach(item => {
    // Assuming quantity and unitPrice are provided, auto-calc item total if needed
    if (item.total === undefined || item.total === 0) {
      item.total = item.quantity * item.unitPrice;
    }
    subtotal += item.total;
  });
  
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;
  
  return { subtotal, taxAmount, total };
}

interface CreateBudgetItemDTO {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  sortOrder?: number;
}

interface CreateBudgetDTO {
  companyId: string;
  clientId?: string;
  installationId?: string;
  title: string;
  description?: string;
  taxRate?: number;
  validUntil?: Date;
  notes?: string;
  createdBy: string;
  items: CreateBudgetItemDTO[];
}

export class CreateBudgetUseCase {
  constructor(private readonly budgetRepository: IBudgetRepository) {}

  async execute(data: CreateBudgetDTO): Promise<Budget> {
    const taxRate = data.taxRate !== undefined ? data.taxRate : 21.00;
    
    // Map items and calculate item totals
    const itemsToCreate = data.items.map((item, index) => ({
      productId: item.productId || null,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
      sortOrder: item.sortOrder !== undefined ? item.sortOrder : index,
    }));

    const { subtotal, taxAmount, total } = calculateTotals(itemsToCreate, taxRate);
    const budgetNumber = await this.budgetRepository.generateBudgetNumber(data.companyId);

    return this.budgetRepository.create({
      companyId: data.companyId,
      clientId: data.clientId || null,
      installationId: data.installationId || null,
      budgetNumber,
      title: data.title,
      description: data.description || null,
      subtotal,
      taxRate,
      taxAmount,
      total,
      status: 'draft',
      validUntil: data.validUntil || null,
      notes: data.notes || null,
      createdBy: data.createdBy,
    }, itemsToCreate);
  }
}

export class GetBudgetUseCase {
  constructor(private readonly budgetRepository: IBudgetRepository) {}

  async execute(id: string, companyId: string): Promise<Budget> {
    const budget = await this.budgetRepository.findByIdAndCompany(id, companyId);
    if (!budget) {
      throw new Error('BUDGET_NOT_FOUND');
    }
    return budget;
  }
}

interface UpdateBudgetDTO {
  id: string;
  companyId: string;
  title?: string;
  description?: string;
  taxRate?: number;
  validUntil?: Date;
  notes?: string;
  items?: CreateBudgetItemDTO[];
}

export class UpdateBudgetUseCase {
  constructor(private readonly budgetRepository: IBudgetRepository) {}

  async execute(data: UpdateBudgetDTO): Promise<Budget> {
    const { id, companyId, items, ...updateData } = data;
    
    const currentBudget = await this.budgetRepository.findByIdAndCompany(id, companyId);
    if (!currentBudget) {
      throw new Error('BUDGET_NOT_FOUND');
    }
    if (currentBudget.status !== 'draft') {
      throw new Error('ONLY_DRAFT_CAN_BE_EDITED');
    }

    let itemsToUpdate: Omit<BudgetItem, 'id' | 'budgetId'>[] | undefined;
    let totalsUpdate = {};

    if (items !== undefined) {
      const taxRate = updateData.taxRate !== undefined ? updateData.taxRate : currentBudget.taxRate;
      
      itemsToUpdate = items.map((item, index) => ({
        productId: item.productId || null,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
        sortOrder: item.sortOrder !== undefined ? item.sortOrder : index,
      }));

      const totals = calculateTotals(itemsToUpdate, taxRate);
      totalsUpdate = {
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        total: totals.total,
      };
    }

    const updatedBudget = await this.budgetRepository.update(
      id, 
      companyId, 
      { ...updateData, ...totalsUpdate }, 
      itemsToUpdate
    );
    
    return updatedBudget as Budget;
  }
}

export class DeleteBudgetUseCase {
  constructor(private readonly budgetRepository: IBudgetRepository) {}

  async execute(id: string, companyId: string): Promise<void> {
    const currentBudget = await this.budgetRepository.findByIdAndCompany(id, companyId);
    if (!currentBudget) {
      throw new Error('BUDGET_NOT_FOUND');
    }
    if (currentBudget.status !== 'draft') {
      throw new Error('ONLY_DRAFT_CAN_BE_DELETED');
    }

    await this.budgetRepository.delete(id, companyId);
  }
}

export class ListBudgetsUseCase {
  constructor(private readonly budgetRepository: IBudgetRepository) {}

  async execute(companyId: string, filters: any = {}, skip: number = 0, limit: number = 100): Promise<any[]> {
    return this.budgetRepository.list(companyId, filters, skip, limit);
  }
}

export class UpdateBudgetStatusUseCase {
  constructor(private readonly budgetRepository: IBudgetRepository) {}

  async execute(id: string, companyId: string, newStatus: BudgetStatus): Promise<Budget> {
    const validTransitions: Record<BudgetStatus, BudgetStatus[]> = {
      'draft': ['sent'],
      'sent': ['approved', 'rejected', 'draft'],
      'rejected': ['draft'],
      'approved': [],
    };

    const budget = await this.budgetRepository.findByIdAndCompany(id, companyId);
    if (!budget) {
      throw new Error('BUDGET_NOT_FOUND');
    }

    const allowed = validTransitions[budget.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(`INVALID_STATUS_TRANSITION`);
    }

    const updatedBudget = await this.budgetRepository.update(id, companyId, { status: newStatus });
    return updatedBudget as Budget;
  }
}

export class DuplicateBudgetUseCase {
  constructor(private readonly budgetRepository: IBudgetRepository) {}

  async execute(id: string, companyId: string, createdBy: string): Promise<Budget> {
    const original = await this.budgetRepository.findByIdAndCompany(id, companyId);
    if (!original) {
      throw new Error('BUDGET_NOT_FOUND');
    }

    const budgetNumber = await this.budgetRepository.generateBudgetNumber(companyId);

    const itemsToCreate = (original.items || []).map(item => ({
      productId: item.productId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
      sortOrder: item.sortOrder,
    }));

    return this.budgetRepository.create({
      companyId: original.companyId,
      clientId: original.clientId,
      installationId: original.installationId,
      budgetNumber,
      title: `${original.title} (copia)`,
      description: original.description,
      subtotal: original.subtotal,
      taxRate: original.taxRate,
      taxAmount: original.taxAmount,
      total: original.total,
      status: 'draft',
      validUntil: original.validUntil,
      notes: original.notes,
      createdBy,
    }, itemsToCreate);
  }
}
