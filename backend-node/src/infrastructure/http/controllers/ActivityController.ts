import { Request, Response } from 'express';
import { CreateActivityUseCase, GetActivityUseCase, UpdateActivityUseCase, DeleteActivityUseCase, ListActivitiesUseCase } from '../../../application/use-cases/ActivityUseCases';

export class ActivityController {
  constructor(
    private readonly createActivityUseCase: CreateActivityUseCase,
    private readonly getActivityUseCase: GetActivityUseCase,
    private readonly updateActivityUseCase: UpdateActivityUseCase,
    private readonly deleteActivityUseCase: DeleteActivityUseCase,
    private readonly listActivitiesUseCase: ListActivitiesUseCase
  ) {}

  async listActivities(req: Request, res: Response) {
    try {
      const skip = parseInt(req.query.skip as string) || 0;
      const limit = parseInt(req.query.limit as string) || 50;
      const companyId = req.current_user.company_id;

      const filters = {
        installationId: req.query.installationId as string,
      };

      const activities = await this.listActivitiesUseCase.execute(companyId, filters, skip, limit);
      res.json(activities);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async getActivity(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const companyId = req.current_user.company_id;

      const activity = await this.getActivityUseCase.execute(id, companyId);
      res.json(activity);
    } catch (error: any) {
      if (error.message === 'ACTIVITY_NOT_FOUND') {
        return res.status(404).json({ detail: 'Activity not found' });
      }
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async createActivity(req: Request, res: Response) {
    try {
      const companyId = req.current_user.company_id;
      const userId = req.current_user.id;
      const activity = await this.createActivityUseCase.execute({
        ...req.body,
        companyId,
        userId,
      });

      res.status(201).json(activity);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async updateActivity(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const companyId = req.current_user.company_id;

      const activity = await this.updateActivityUseCase.execute({
        id,
        companyId,
        ...req.body,
      });

      res.json(activity);
    } catch (error: any) {
      if (error.message === 'ACTIVITY_NOT_FOUND') {
        return res.status(404).json({ detail: 'Activity not found' });
      }
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async deleteActivity(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const companyId = req.current_user.company_id;

      await this.deleteActivityUseCase.execute(id, companyId);
      res.status(204).send();
    } catch (error: any) {
      if (error.message === 'ACTIVITY_NOT_FOUND') {
        return res.status(404).json({ detail: 'Activity not found' });
      }
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }
}
