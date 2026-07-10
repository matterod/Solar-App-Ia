import { Request, Response } from 'express';
import { CreateClientUseCase, GetClientUseCase, UpdateClientUseCase, DeleteClientUseCase, ListClientsUseCase } from '../../../application/use-cases/ClientUseCases';

export class ClientController {
  constructor(
    private readonly createClientUseCase: CreateClientUseCase,
    private readonly getClientUseCase: GetClientUseCase,
    private readonly updateClientUseCase: UpdateClientUseCase,
    private readonly deleteClientUseCase: DeleteClientUseCase,
    private readonly listClientsUseCase: ListClientsUseCase
  ) {}

  async listClients(req: Request, res: Response) {
    try {
      const skip = parseInt(req.query.skip as string) || 0;
      const limit = parseInt(req.query.limit as string) || 100;
      const search = (req.query.search as string) || null;
      const companyId = req.current_user.company_id;

      const clients = await this.listClientsUseCase.execute(companyId, search, skip, limit);
      res.json(clients);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async getClient(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const companyId = req.current_user.company_id;

      const client = await this.getClientUseCase.execute(id, companyId);
      res.json(client);
    } catch (error: any) {
      if (error.message === 'CLIENT_NOT_FOUND') {
        return res.status(404).json({ detail: 'Client not found' });
      }
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async createClient(req: Request, res: Response) {
    try {
      const companyId = req.current_user.company_id;
      const createdBy = req.current_user.id;
      const client = await this.createClientUseCase.execute({
        ...req.body,
        companyId,
        createdBy,
      });

      res.status(201).json(client);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async updateClient(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const companyId = req.current_user.company_id;

      const client = await this.updateClientUseCase.execute({
        id,
        companyId,
        ...req.body,
      });

      res.json(client);
    } catch (error: any) {
      if (error.message === 'CLIENT_NOT_FOUND') {
        return res.status(404).json({ detail: 'Client not found' });
      }
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async deleteClient(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const companyId = req.current_user.company_id;

      await this.deleteClientUseCase.execute(id, companyId);
      res.status(204).send();
    } catch (error: any) {
      if (error.message === 'CLIENT_NOT_FOUND') {
        return res.status(404).json({ detail: 'Client not found' });
      }
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }
}
