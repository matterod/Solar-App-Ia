import { Request, Response } from 'express';
import { ProblemStatus } from '../../../domain/entities/Problem';
import { 
  CreateProblemUseCase, 
  GetProblemUseCase, 
  UpdateProblemUseCase, 
  DeleteProblemUseCase, 
  ListProblemsUseCase,
  AddSolutionUseCase
} from '../../../application/use-cases/ProblemUseCases';

export class ProblemController {
  constructor(
    private readonly createProblemUseCase: CreateProblemUseCase,
    private readonly getProblemUseCase: GetProblemUseCase,
    private readonly updateProblemUseCase: UpdateProblemUseCase,
    private readonly deleteProblemUseCase: DeleteProblemUseCase,
    private readonly listProblemsUseCase: ListProblemsUseCase,
    private readonly addSolutionUseCase: AddSolutionUseCase
  ) {}

  async listProblems(req: Request, res: Response) {
    try {
      const skip = parseInt(req.query.skip as string) || 0;
      const limit = parseInt(req.query.limit as string) || 100;
      const companyId = req.current_user.company_id;

      const filters = {
        status: req.query.status as string,
        search: req.query.search as string,
      };

      const problems = await this.listProblemsUseCase.execute(companyId, filters, skip, limit);
      res.json(problems);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async getProblem(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const companyId = req.current_user.company_id;

      const problem = await this.getProblemUseCase.execute(id, companyId);
      res.json(problem);
    } catch (error: any) {
      if (error.message === 'PROBLEM_NOT_FOUND') {
        return res.status(404).json({ detail: 'Problema no encontrado' });
      }
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async createProblem(req: Request, res: Response) {
    try {
      const companyId = req.current_user.company_id;
      
      const problem = await this.createProblemUseCase.execute({
        ...req.body,
        companyId,
      });

      res.status(201).json(problem);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async updateProblem(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const companyId = req.current_user.company_id;

      const problem = await this.updateProblemUseCase.execute({
        id,
        companyId,
        ...req.body,
      });

      res.json(problem);
    } catch (error: any) {
      if (error.message === 'PROBLEM_NOT_FOUND') {
        return res.status(404).json({ detail: 'Problema no encontrado' });
      }
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async deleteProblem(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const companyId = req.current_user.company_id;

      await this.deleteProblemUseCase.execute(id, companyId);
      res.status(204).send();
    } catch (error: any) {
      if (error.message === 'PROBLEM_NOT_FOUND') {
        return res.status(404).json({ detail: 'Problema no encontrado' });
      }
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async addSolution(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const companyId = req.current_user.company_id;

      const solution = await this.addSolutionUseCase.execute({
        problemId: id,
        companyId,
        description: req.body.description,
      });

      res.status(201).json(solution);
    } catch (error: any) {
      if (error.message === 'PROBLEM_NOT_FOUND') {
        return res.status(404).json({ detail: 'Problema no encontrado' });
      }
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }
}
