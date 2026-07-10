import { Client } from '../entities/Client';

export interface IClientRepository {
  create(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client>;
  findByIdAndCompany(id: string, companyId: string): Promise<Client | null>;
  update(id: string, companyId: string, data: Partial<Omit<Client, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>>): Promise<Client | null>;
  delete(id: string, companyId: string): Promise<boolean>;
  list(companyId: string, search: string | null, skip: number, limit: number): Promise<Client[]>;
}
