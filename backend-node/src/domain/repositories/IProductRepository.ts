import { Product } from '../entities/Product';

export interface IProductRepository {
  findByIdAndCompany(id: string, companyId: string): Promise<Product | null>;
  updateStock(id: string, newStock: number): Promise<void>;
  
  create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
  update(id: string, companyId: string, data: Partial<Omit<Product, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>>): Promise<Product | null>;
  list(companyId: string, filters: any, skip: number, limit: number, sort: string): Promise<Product[]>;
}
