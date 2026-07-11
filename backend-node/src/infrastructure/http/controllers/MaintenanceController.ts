import { Request, Response } from 'express';
import { CreateMaintenanceUseCase, GetMaintenanceUseCase, UpdateMaintenanceUseCase, DeleteMaintenanceUseCase, ListMaintenancesUseCase } from '../../../application/use-cases/MaintenanceUseCases';

export class MaintenanceController {
  constructor(
    private readonly createMaintenanceUseCase: CreateMaintenanceUseCase,
    private readonly getMaintenanceUseCase: GetMaintenanceUseCase,
    private readonly updateMaintenanceUseCase: UpdateMaintenanceUseCase,
    private readonly deleteMaintenanceUseCase: DeleteMaintenanceUseCase,
    private readonly listMaintenancesUseCase: ListMaintenancesUseCase
  ) {}

  async listMaintenances(req: Request, res: Response) {
    try {
      const skip = parseInt(req.query.skip as string) || 0;
      const limit = parseInt(req.query.limit as string) || 50;
      const companyId = req.current_user.company_id;

      const filters = {
        installationId: req.query.installationId as string,
        status: req.query.status as string,
        upcomingDays: req.query.upcomingDays as string,
      };

      const maintenances = await this.listMaintenancesUseCase.execute(companyId, filters, skip, limit);
      res.json(maintenances);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async getMaintenance(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const companyId = req.current_user.company_id;

      const maintenance = await this.getMaintenanceUseCase.execute(id, companyId);
      res.json(maintenance);
    } catch (error: any) {
      if (error.message === 'MAINTENANCE_NOT_FOUND') {
        return res.status(404).json({ detail: 'Maintenance record not found' });
      }
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async createMaintenance(req: Request, res: Response) {
    try {
      const companyId = req.current_user.company_id;
      const maintenance = await this.createMaintenanceUseCase.execute({
        ...req.body,
        companyId,
      });

      res.status(201).json(maintenance);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async updateMaintenance(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const companyId = req.current_user.company_id;

      const maintenance = await this.updateMaintenanceUseCase.execute({
        id,
        companyId,
        ...req.body,
      });

      res.json(maintenance);
    } catch (error: any) {
      if (error.message === 'MAINTENANCE_NOT_FOUND') {
        return res.status(404).json({ detail: 'Maintenance record not found' });
      }
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async deleteMaintenance(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const companyId = req.current_user.company_id;

      await this.deleteMaintenanceUseCase.execute(id, companyId);
      res.status(204).send();
    } catch (error: any) {
      if (error.message === 'MAINTENANCE_NOT_FOUND') {
        return res.status(404).json({ detail: 'Maintenance record not found' });
      }
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }
}
