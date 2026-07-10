import { Installation } from '../entities/Installation';

export interface IInstallationRepository {
  create(installation: Omit<Installation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Installation>;
  findByIdAndCompany(id: string, companyId: string): Promise<Installation | null>;
  update(id: string, companyId: string, data: Partial<Omit<Installation, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>>): Promise<Installation | null>;
  delete(id: string, companyId: string): Promise<boolean>;
  list(companyId: string, filters: any, skip: number, limit: number): Promise<Installation[]>;
}
