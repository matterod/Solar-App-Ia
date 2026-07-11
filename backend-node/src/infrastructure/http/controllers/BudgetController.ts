import { Request, Response } from 'express';
import { BudgetStatus } from '../../../domain/entities/Budget';
import { 
  CreateBudgetUseCase, 
  GetBudgetUseCase, 
  UpdateBudgetUseCase, 
  DeleteBudgetUseCase, 
  ListBudgetsUseCase,
  UpdateBudgetStatusUseCase,
  DuplicateBudgetUseCase 
} from '../../../application/use-cases/BudgetUseCases';

export class BudgetController {
  constructor(
    private readonly createBudgetUseCase: CreateBudgetUseCase,
    private readonly getBudgetUseCase: GetBudgetUseCase,
    private readonly updateBudgetUseCase: UpdateBudgetUseCase,
    private readonly deleteBudgetUseCase: DeleteBudgetUseCase,
    private readonly listBudgetsUseCase: ListBudgetsUseCase,
    private readonly updateBudgetStatusUseCase: UpdateBudgetStatusUseCase,
    private readonly duplicateBudgetUseCase: DuplicateBudgetUseCase
  ) {}

  async listBudgets(req: Request, res: Response) {
    try {
      const skip = parseInt(req.query.skip as string) || 0;
      const limit = parseInt(req.query.limit as string) || 100;
      const companyId = req.current_user.company_id;

      const filters = {
        status: req.query.status as string,
        clientId: req.query.clientId as string,
        installationId: req.query.installationId as string,
        search: req.query.search as string,
      };

      const budgets = await this.listBudgetsUseCase.execute(companyId, filters, skip, limit);
      res.json(budgets);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async getBudget(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const companyId = req.current_user.company_id;

      const budget = await this.getBudgetUseCase.execute(id, companyId);
      res.json(budget);
    } catch (error: any) {
      if (error.message === 'BUDGET_NOT_FOUND') {
        return res.status(404).json({ detail: 'Presupuesto no encontrado' });
      }
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async createBudget(req: Request, res: Response) {
    try {
      const companyId = req.current_user.company_id;
      const createdBy = req.current_user.id;
      
      const budget = await this.createBudgetUseCase.execute({
        ...req.body,
        companyId,
        createdBy,
      });

      res.status(201).json(budget);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async updateBudget(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const companyId = req.current_user.company_id;

      const budget = await this.updateBudgetUseCase.execute({
        id,
        companyId,
        ...req.body,
      });

      res.json(budget);
    } catch (error: any) {
      if (error.message === 'BUDGET_NOT_FOUND') {
        return res.status(404).json({ detail: 'Presupuesto no encontrado' });
      }
      if (error.message === 'ONLY_DRAFT_CAN_BE_EDITED') {
        return res.status(400).json({ detail: 'Solo se pueden editar presupuestos en estado borrador' });
      }
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async deleteBudget(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const companyId = req.current_user.company_id;

      await this.deleteBudgetUseCase.execute(id, companyId);
      res.status(204).send();
    } catch (error: any) {
      if (error.message === 'BUDGET_NOT_FOUND') {
        return res.status(404).json({ detail: 'Presupuesto no encontrado' });
      }
      if (error.message === 'ONLY_DRAFT_CAN_BE_DELETED') {
        return res.status(400).json({ detail: 'Solo se pueden eliminar presupuestos en estado borrador' });
      }
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async updateBudgetStatus(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const companyId = req.current_user.company_id;
      const { status } = req.body;

      const budget = await this.updateBudgetStatusUseCase.execute(id, companyId, status as BudgetStatus);
      res.json(budget);
    } catch (error: any) {
      if (error.message === 'BUDGET_NOT_FOUND') {
        return res.status(404).json({ detail: 'Presupuesto no encontrado' });
      }
      if (error.message === 'INVALID_STATUS_TRANSITION') {
        return res.status(400).json({ detail: 'Transición de estado inválida' });
      }
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async duplicateBudget(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const companyId = req.current_user.company_id;
      const createdBy = req.current_user.id;

      const budget = await this.duplicateBudgetUseCase.execute(id, companyId, createdBy);
      res.status(201).json(budget);
    } catch (error: any) {
      if (error.message === 'BUDGET_NOT_FOUND') {
        return res.status(404).json({ detail: 'Presupuesto no encontrado' });
      }
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async getBudgetPdf(req: Request, res: Response) {
    // TODO: Implement PDF generation
    return res.status(501).json({ detail: 'PDF generation is not implemented yet in Node.js version' });
  }
}
