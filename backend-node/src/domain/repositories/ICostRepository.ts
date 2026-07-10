import { Cost } from '../entities/Cost';

export interface ICostRepository {
  create(cost: Omit<Cost, 'id' | 'createdAt'>): Promise<Cost>;
  findByIdAndCompany(id: string, companyId: string): Promise<Cost | null>;
  update(id: string, companyId: string, data: Partial<Omit<Cost, 'id' | 'companyId' | 'createdAt'>>): Promise<Cost | null>;
  delete(id: string, companyId: string): Promise<boolean>;
  list(companyId: string, filters: any, skip: number, limit: number): Promise<Cost[]>;
}
