import { IProblemRepository } from '../../domain/repositories/IProblemRepository';
import { Problem, Solution, ProblemStatus } from '../../domain/entities/Problem';

interface CreateProblemDTO {
  companyId: string;
  title: string;
  description: string;
  tags?: string[];
}

export class CreateProblemUseCase {
  constructor(private readonly problemRepository: IProblemRepository) {}

  async execute(data: CreateProblemDTO): Promise<Problem> {
    return this.problemRepository.create({
      companyId: data.companyId,
      title: data.title,
      description: data.description,
      status: 'open',
      tags: data.tags || [],
    });
  }
}

export class GetProblemUseCase {
  constructor(private readonly problemRepository: IProblemRepository) {}

  async execute(id: string, companyId: string): Promise<Problem> {
    const problem = await this.problemRepository.findByIdAndCompany(id, companyId);
    if (!problem) {
      throw new Error('PROBLEM_NOT_FOUND');
    }
    return problem;
  }
}

interface UpdateProblemDTO {
  id: string;
  companyId: string;
  title?: string;
  description?: string;
  status?: ProblemStatus;
  tags?: string[];
}

export class UpdateProblemUseCase {
  constructor(private readonly problemRepository: IProblemRepository) {}

  async execute(data: UpdateProblemDTO): Promise<Problem> {
    const { id, companyId, ...updateData } = data;
    const updatedProblem = await this.problemRepository.update(id, companyId, updateData);
    
    if (!updatedProblem) {
      throw new Error('PROBLEM_NOT_FOUND');
    }
    
    return updatedProblem;
  }
}

export class DeleteProblemUseCase {
  constructor(private readonly problemRepository: IProblemRepository) {}

  async execute(id: string, companyId: string): Promise<void> {
    const deleted = await this.problemRepository.delete(id, companyId);
    if (!deleted) {
      throw new Error('PROBLEM_NOT_FOUND');
    }
  }
}

export class ListProblemsUseCase {
  constructor(private readonly problemRepository: IProblemRepository) {}

  async execute(companyId: string, filters: any = {}, skip: number = 0, limit: number = 100): Promise<Problem[]> {
    return this.problemRepository.list(companyId, filters, skip, limit);
  }
}

interface AddSolutionDTO {
  problemId: string;
  companyId: string;
  description: string;
}

export class AddSolutionUseCase {
  constructor(private readonly problemRepository: IProblemRepository) {}

  async execute(data: AddSolutionDTO): Promise<Solution> {
    const problem = await this.problemRepository.findByIdAndCompany(data.problemId, data.companyId);
    if (!problem) {
      throw new Error('PROBLEM_NOT_FOUND');
    }

    const solution = await this.problemRepository.addSolution({
      problemId: data.problemId,
      description: data.description,
    });

    // Automatically resolve the problem if a solution is added
    if (problem.status === 'open') {
      await this.problemRepository.update(data.problemId, data.companyId, { status: 'resolved' });
    }

    return solution;
  }
}
