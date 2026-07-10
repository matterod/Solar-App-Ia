import { Op } from 'sequelize';
import { Client } from '../../domain/entities/Client';
import { IClientRepository } from '../../domain/repositories/IClientRepository';
import { ClientModel } from '../database/models/ClientModel';

export class SequelizeClientRepository implements IClientRepository {
  async create(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> {
    const newClient = await ClientModel.create(client as any);
    return newClient.toJSON() as Client;
  }

  async findByIdAndCompany(id: string, companyId: string): Promise<Client | null> {
    const client = await ClientModel.findOne({
      where: { id, companyId },
    });
    return client ? client.toJSON() as Client : null;
  }

  async update(id: string, companyId: string, data: Partial<Omit<Client, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>>): Promise<Client | null> {
    const [updatedRows] = await ClientModel.update(data, {
      where: { id, companyId },
    });
    
    if (updatedRows === 0) return null;
    return this.findByIdAndCompany(id, companyId);
  }

  async delete(id: string, companyId: string): Promise<boolean> {
    const deletedRows = await ClientModel.destroy({
      where: { id, companyId },
    });
    return deletedRows > 0;
  }

  async list(companyId: string, search: string | null, skip: number, limit: number): Promise<Client[]> {
    const whereClause: any = { companyId };
    
    if (search) {
      whereClause.name = { [Op.iLike]: `%${search}%` };
    }

    const clients = await ClientModel.findAll({
      where: whereClause,
      limit,
      offset: skip,
      order: [['name', 'ASC']],
    });
    return clients.map((c: any) => c.toJSON() as Client);
  }
}
