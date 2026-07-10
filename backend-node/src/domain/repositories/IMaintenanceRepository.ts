import { Maintenance } from '../entities/Maintenance';

export interface IMaintenanceRepository {
  create(maintenance: Omit<Maintenance, 'id' | 'createdAt' | 'updatedAt'>): Promise<Maintenance>;
  findByIdAndCompany(id: string, companyId: string): Promise<Maintenance | null>;
  update(id: string, companyId: string, data: Partial<Omit<Maintenance, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>>): Promise<Maintenance | null>;
  delete(id: string, companyId: string): Promise<boolean>;
  list(companyId: string, filters: any, skip: number, limit: number): Promise<Maintenance[]>;
}
