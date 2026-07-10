import { Supplier } from '../entities/Supplier';

export interface ISupplierRepository {
  create(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier>;
  findByIdAndCompany(id: string, companyId: string): Promise<Supplier | null>;
  update(id: string, companyId: string, data: Partial<Omit<Supplier, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>>): Promise<Supplier | null>;
  delete(id: string, companyId: string): Promise<boolean>;
  list(companyId: string, search: string | null, skip: number, limit: number): Promise<Supplier[]>;
}
