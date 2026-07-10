import { Request, Response } from 'express';
import { GetDashboardStatsUseCase } from '../../../application/use-cases/DashboardUseCases';

export class DashboardController {
  constructor(private readonly getDashboardStatsUseCase: GetDashboardStatsUseCase) {}

  async getStats(req: Request, res: Response) {
    try {
      const companyId = req.current_user.company_id;
      const stats = await this.getDashboardStatsUseCase.execute(companyId);
      res.json(stats);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }
}
