import { IMaintenanceRepository } from '../../domain/repositories/IMaintenanceRepository';
import { Maintenance, MaintenanceStatus } from '../../domain/entities/Maintenance';

interface CreateMaintenanceDTO {
  installationId: string;
  companyId: string;
  scheduledDate: Date;
  completedDate?: Date;
  status?: MaintenanceStatus;
  maintenanceType?: string;
  description?: string;
  findings?: string;
  assignedTo?: string;
  lastNotificationDaysBefore?: number;
}

export class CreateMaintenanceUseCase {
  constructor(private readonly maintenanceRepository: IMaintenanceRepository) {}

  async execute(data: CreateMaintenanceDTO): Promise<Maintenance> {
    return this.maintenanceRepository.create({
      installationId: data.installationId,
      companyId: data.companyId,
      scheduledDate: data.scheduledDate,
      completedDate: data.completedDate || null,
      status: data.status || 'scheduled',
      maintenanceType: data.maintenanceType || 'routine',
      description: data.description || null,
      findings: data.findings || null,
      assignedTo: data.assignedTo || null,
      lastNotificationDaysBefore: data.lastNotificationDaysBefore || null,
    });
  }
}

export class GetMaintenanceUseCase {
  constructor(private readonly maintenanceRepository: IMaintenanceRepository) {}

  async execute(id: string, companyId: string): Promise<Maintenance> {
    const maintenance = await this.maintenanceRepository.findByIdAndCompany(id, companyId);
    if (!maintenance) {
      throw new Error('MAINTENANCE_NOT_FOUND');
    }
    return maintenance;
  }
}

interface UpdateMaintenanceDTO {
  id: string;
  companyId: string;
  scheduledDate?: Date;
  completedDate?: Date;
  status?: MaintenanceStatus;
  maintenanceType?: string;
  description?: string;
  findings?: string;
  assignedTo?: string;
  lastNotificationDaysBefore?: number;
}

export class UpdateMaintenanceUseCase {
  constructor(private readonly maintenanceRepository: IMaintenanceRepository) {}

  async execute(data: UpdateMaintenanceDTO): Promise<Maintenance> {
    const { id, companyId, ...updateData } = data;
    const updatedMaintenance = await this.maintenanceRepository.update(id, companyId, updateData);
    
    if (!updatedMaintenance) {
      throw new Error('MAINTENANCE_NOT_FOUND');
    }
    
    return updatedMaintenance;
  }
}

export class DeleteMaintenanceUseCase {
  constructor(private readonly maintenanceRepository: IMaintenanceRepository) {}

  async execute(id: string, companyId: string): Promise<void> {
    const deleted = await this.maintenanceRepository.delete(id, companyId);
    if (!deleted) {
      throw new Error('MAINTENANCE_NOT_FOUND');
    }
  }
}

export class ListMaintenancesUseCase {
  constructor(private readonly maintenanceRepository: IMaintenanceRepository) {}

  async execute(companyId: string, filters: any = {}, skip: number = 0, limit: number = 100): Promise<Maintenance[]> {
    return this.maintenanceRepository.list(companyId, filters, skip, limit);
  }
}
