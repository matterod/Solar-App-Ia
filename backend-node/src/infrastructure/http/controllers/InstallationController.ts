import { Request, Response } from 'express';
import { CreateInstallationUseCase, GetInstallationUseCase, UpdateInstallationUseCase, DeleteInstallationUseCase, ListInstallationsUseCase } from '../../../application/use-cases/InstallationUseCases';

export class InstallationController {
  constructor(
    private readonly createInstallationUseCase: CreateInstallationUseCase,
    private readonly getInstallationUseCase: GetInstallationUseCase,
    private readonly updateInstallationUseCase: UpdateInstallationUseCase,
    private readonly deleteInstallationUseCase: DeleteInstallationUseCase,
    private readonly listInstallationsUseCase: ListInstallationsUseCase
  ) {}

  async listInstallations(req: Request, res: Response) {
    try {
      const skip = parseInt(req.query.skip as string) || 0;
      const limit = parseInt(req.query.limit as string) || 100;
      const companyId = req.current_user.company_id;

      const filters = {
        status: req.query.status as string,
        search: req.query.search as string,
        clientId: req.query.client_id as string,
      };

      const installations = await this.listInstallationsUseCase.execute(companyId, filters, skip, limit);
      res.json(installations);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async getInstallation(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const companyId = req.current_user.company_id;

      const installation = await this.getInstallationUseCase.execute(id, companyId);
      res.json(installation);
    } catch (error: any) {
      if (error.message === 'INSTALLATION_NOT_FOUND') {
        return res.status(404).json({ detail: 'Installation not found' });
      }
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async createInstallation(req: Request, res: Response) {
    try {
      const companyId = req.current_user.company_id;
      const createdBy = req.current_user.id;
      const installation = await this.createInstallationUseCase.execute({
        ...req.body,
        companyId,
        createdBy,
      });

      res.status(201).json(installation);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async updateInstallation(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const companyId = req.current_user.company_id;

      const installation = await this.updateInstallationUseCase.execute({
        id,
        companyId,
        ...req.body,
      });

      res.json(installation);
    } catch (error: any) {
      if (error.message === 'INSTALLATION_NOT_FOUND') {
        return res.status(404).json({ detail: 'Installation not found' });
      }
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async deleteInstallation(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const companyId = req.current_user.company_id;

      await this.deleteInstallationUseCase.execute(id, companyId);
      res.status(204).send();
    } catch (error: any) {
      if (error.message === 'INSTALLATION_NOT_FOUND') {
        return res.status(404).json({ detail: 'Installation not found' });
      }
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }
}
