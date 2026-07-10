import { Op } from 'sequelize';
import { Problem, Solution } from '../../domain/entities/Problem';
import { IProblemRepository } from '../../domain/repositories/IProblemRepository';
import { ProblemModel, SolutionModel } from '../database/models/ProblemModel';

export class SequelizeProblemRepository implements IProblemRepository {
  async create(problem: Omit<Problem, 'id' | 'createdAt' | 'updatedAt'>): Promise<Problem> {
    const newProblem = await ProblemModel.create(problem as any);
    return newProblem.toJSON() as Problem;
  }

  async findByIdAndCompany(id: string, companyId: string): Promise<Problem | null> {
    const problem = await ProblemModel.findOne({
      where: { id, companyId },
      include: [{ model: SolutionModel, as: 'solutions' }]
    });
    return problem ? problem.toJSON() as Problem : null;
  }

  async update(id: string, companyId: string, data: Partial<Omit<Problem, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>>): Promise<Problem | null> {
    const [updatedRows] = await ProblemModel.update(data, {
      where: { id, companyId },
    });
    
    if (updatedRows === 0) return null;
    return this.findByIdAndCompany(id, companyId);
  }

  async delete(id: string, companyId: string): Promise<boolean> {
    const deletedRows = await ProblemModel.destroy({
      where: { id, companyId },
    });
    return deletedRows > 0;
  }

  async list(companyId: string, filters: any, skip: number, limit: number): Promise<Problem[]> {
    const whereClause: any = { companyId };
    
    if (filters.status) {
      whereClause.status = filters.status;
    }
    if (filters.search) {
      whereClause.title = { [Op.iLike]: `%${filters.search}%` };
    }

    const problems = await ProblemModel.findAll({
      where: whereClause,
      limit,
      offset: skip,
      order: [['createdAt', 'DESC']],
      include: [{ model: SolutionModel, as: 'solutions' }]
    });
    return problems.map(p => p.toJSON() as Problem);
  }

  async addSolution(solution: Omit<Solution, 'id' | 'createdAt'>): Promise<Solution> {
    const newSolution = await SolutionModel.create(solution as any);
    return newSolution.toJSON() as Solution;
  }
}
