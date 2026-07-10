import { Request, Response } from 'express';
import { CreateCostUseCase, GetCostUseCase, UpdateCostUseCase, DeleteCostUseCase, ListCostsUseCase } from '../../../application/use-cases/CostUseCases';

export class CostController {
  constructor(
    private readonly createCostUseCase: CreateCostUseCase,
    private readonly getCostUseCase: GetCostUseCase,
    private readonly updateCostUseCase: UpdateCostUseCase,
    private readonly deleteCostUseCase: DeleteCostUseCase,
    private readonly listCostsUseCase: ListCostsUseCase
  ) {}

  async listCosts(req: Request, res: Response) {
    try {
      if (!req.query.installation_id) {
        return res.status(400).json({ detail: 'installation_id is required' });
      }

      const skip = parseInt(req.query.skip as string) || 0;
      const limit = parseInt(req.query.limit as string) || 50;
      const companyId = req.current_user.company_id;

      const filters = {
        installationId: req.query.installation_id as string,
      };

      const costs = await this.listCostsUseCase.execute(companyId, filters, skip, limit);
      res.json(costs);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async getCost(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const companyId = req.current_user.company_id;

      const cost = await this.getCostUseCase.execute(id, companyId);
      res.json(cost);
    } catch (error: any) {
      if (error.message === 'COST_NOT_FOUND') {
        return res.status(404).json({ detail: 'Cost not found' });
      }
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async createCost(req: Request, res: Response) {
    try {
      const companyId = req.current_user.company_id;
      const createdBy = req.current_user.id;
      
      const cost = await this.createCostUseCase.execute({
        ...req.body,
        companyId,
        createdBy,
      });

      res.status(201).json(cost);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async updateCost(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const companyId = req.current_user.company_id;

      const cost = await this.updateCostUseCase.execute({
        id,
        companyId,
        ...req.body,
      });

      res.json(cost);
    } catch (error: any) {
      if (error.message === 'COST_NOT_FOUND') {
        return res.status(404).json({ detail: 'Cost not found' });
      }
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async deleteCost(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const companyId = req.current_user.company_id;

      await this.deleteCostUseCase.execute(id, companyId);
      res.status(204).send();
    } catch (error: any) {
      if (error.message === 'COST_NOT_FOUND') {
        return res.status(404).json({ detail: 'Cost not found' });
      }
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }
}
