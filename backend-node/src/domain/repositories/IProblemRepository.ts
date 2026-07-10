import { Problem, Solution } from '../entities/Problem';

export interface IProblemRepository {
  create(problem: Omit<Problem, 'id' | 'createdAt' | 'updatedAt'>): Promise<Problem>;
  findByIdAndCompany(id: string, companyId: string): Promise<Problem | null>;
  update(id: string, companyId: string, data: Partial<Omit<Problem, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>>): Promise<Problem | null>;
  delete(id: string, companyId: string): Promise<boolean>;
  list(companyId: string, filters: any, skip: number, limit: number): Promise<Problem[]>;
  
  addSolution(solution: Omit<Solution, 'id' | 'createdAt'>): Promise<Solution>;
}
