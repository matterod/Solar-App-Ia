import { Activity } from '../entities/Activity';

export interface IActivityRepository {
  create(activity: Omit<Activity, 'id' | 'createdAt'>): Promise<Activity>;
  findByIdAndCompany(id: string, companyId: string): Promise<Activity | null>;
  update(id: string, companyId: string, data: Partial<Omit<Activity, 'id' | 'companyId' | 'createdAt'>>): Promise<Activity | null>;
  delete(id: string, companyId: string): Promise<boolean>;
  list(companyId: string, filters: any, skip: number, limit: number): Promise<Activity[]>;
}
