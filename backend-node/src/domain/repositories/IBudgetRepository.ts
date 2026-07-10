import { Budget, BudgetItem } from '../entities/Budget';

export interface IBudgetRepository {
  create(budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'items'>, items: Omit<BudgetItem, 'id' | 'budgetId'>[]): Promise<Budget>;
  findByIdAndCompany(id: string, companyId: string): Promise<Budget | null>;
  update(id: string, companyId: string, data: Partial<Omit<Budget, 'id' | 'companyId' | 'createdAt' | 'updatedAt' | 'items'>>, items?: Omit<BudgetItem, 'id' | 'budgetId'>[]): Promise<Budget | null>;
  delete(id: string, companyId: string): Promise<boolean>;
  list(companyId: string, filters: any, skip: number, limit: number): Promise<any[]>;
  generateBudgetNumber(companyId: string): Promise<string>;
}
