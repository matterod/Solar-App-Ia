import { IClientRepository } from '../../domain/repositories/IClientRepository';
import { Client } from '../../domain/entities/Client';

interface CreateClientDTO {
  companyId: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  taxId?: string;
  address?: string;
  city?: string;
  province?: string;
  notes?: string;
  createdBy: string;
}

export class CreateClientUseCase {
  constructor(private readonly clientRepository: IClientRepository) {}

  async execute(data: CreateClientDTO): Promise<Client> {
    return this.clientRepository.create({
      companyId: data.companyId,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      company: data.company || null,
      taxId: data.taxId || null,
      address: data.address || null,
      city: data.city || null,
      province: data.province || null,
      notes: data.notes || null,
      createdBy: data.createdBy,
    });
  }
}

export class GetClientUseCase {
  constructor(private readonly clientRepository: IClientRepository) {}

  async execute(id: string, companyId: string): Promise<Client> {
    const client = await this.clientRepository.findByIdAndCompany(id, companyId);
    if (!client) {
      throw new Error('CLIENT_NOT_FOUND');
    }
    return client;
  }
}

interface UpdateClientDTO {
  id: string;
  companyId: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  taxId?: string;
  address?: string;
  city?: string;
  province?: string;
  notes?: string;
}

export class UpdateClientUseCase {
  constructor(private readonly clientRepository: IClientRepository) {}

  async execute(data: UpdateClientDTO): Promise<Client> {
    const { id, companyId, ...updateData } = data;
    const updatedClient = await this.clientRepository.update(id, companyId, updateData);
    
    if (!updatedClient) {
      throw new Error('CLIENT_NOT_FOUND');
    }
    
    return updatedClient;
  }
}

export class DeleteClientUseCase {
  constructor(private readonly clientRepository: IClientRepository) {}

  async execute(id: string, companyId: string): Promise<void> {
    const deleted = await this.clientRepository.delete(id, companyId);
    if (!deleted) {
      throw new Error('CLIENT_NOT_FOUND');
    }
  }
}

export class ListClientsUseCase {
  constructor(private readonly clientRepository: IClientRepository) {}

  async execute(companyId: string, search: string | null = null, skip: number = 0, limit: number = 100): Promise<Client[]> {
    return this.clientRepository.list(companyId, search, skip, limit);
  }
}
