import { Request, Response } from 'express';
import { 
  CreatePendingTaskUseCase, 
  GetPendingTaskUseCase, 
  UpdatePendingTaskUseCase, 
  DeletePendingTaskUseCase, 
  ListPendingTasksUseCase 
} from '../../../application/use-cases/PendingTaskUseCases';

export class PendingTaskController {
  constructor(
    private readonly createPendingTaskUseCase: CreatePendingTaskUseCase,
    private readonly getPendingTaskUseCase: GetPendingTaskUseCase,
    private readonly updatePendingTaskUseCase: UpdatePendingTaskUseCase,
    private readonly deletePendingTaskUseCase: DeletePendingTaskUseCase,
    private readonly listPendingTasksUseCase: ListPendingTasksUseCase
  ) {}

  async listTasks(req: Request, res: Response) {
    try {
      const skip = parseInt(req.query.skip as string) || 0;
      const limit = parseInt(req.query.limit as string) || 100;
      const companyId = req.current_user.company_id;

      const filters = {
        status: req.query.status as string,
        priority: req.query.priority as string,
        installationId: req.query.installation_id as string,
        assignedTo: req.query.assigned_to as string,
      };

      const tasks = await this.listPendingTasksUseCase.execute(companyId, filters, skip, limit);
      res.json(tasks);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async getTask(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const companyId = req.current_user.company_id;

      const task = await this.getPendingTaskUseCase.execute(id, companyId);
      res.json(task);
    } catch (error: any) {
      if (error.message === 'PENDING_TASK_NOT_FOUND') {
        return res.status(404).json({ detail: 'Tarea no encontrada' });
      }
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async createTask(req: Request, res: Response) {
    try {
      const companyId = req.current_user.company_id;
      const createdBy = req.current_user.id;
      
      const task = await this.createPendingTaskUseCase.execute({
        ...req.body,
        companyId,
        createdBy,
      });

      res.status(201).json(task);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async updateTask(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const companyId = req.current_user.company_id;

      const task = await this.updatePendingTaskUseCase.execute({
        id,
        companyId,
        ...req.body,
      });

      res.json(task);
    } catch (error: any) {
      if (error.message === 'PENDING_TASK_NOT_FOUND') {
        return res.status(404).json({ detail: 'Tarea no encontrada' });
      }
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async deleteTask(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const companyId = req.current_user.company_id;

      await this.deletePendingTaskUseCase.execute(id, companyId);
      res.status(204).send();
    } catch (error: any) {
      if (error.message === 'PENDING_TASK_NOT_FOUND') {
        return res.status(404).json({ detail: 'Tarea no encontrada' });
      }
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }
}
