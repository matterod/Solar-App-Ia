import { IInstallationRepository } from '../../domain/repositories/IInstallationRepository';
import { Installation, InstallationStatus } from '../../domain/entities/Installation';

interface CreateInstallationDTO {
  companyId: string;
  clientId: string;
  locationName: string;
  address: string;
  city?: string;
  province?: string;
  latitude?: number;
  longitude?: number;
  panelCount?: number;
  panelModel?: string;
  inverterModel?: string;
  inverterCount?: number;
  systemPowerKw?: number;
  installationDate?: Date;
  status?: InstallationStatus;
  description?: string;
  assignedTo?: string;
  createdBy: string;
}

import { IMaintenanceRepository } from '../../domain/repositories/IMaintenanceRepository';

export class CreateInstallationUseCase {
  constructor(
    private readonly installationRepository: IInstallationRepository,
    private readonly maintenanceRepository: IMaintenanceRepository
  ) {}

  async execute(data: CreateInstallationDTO): Promise<Installation> {
    const installation = await this.installationRepository.create({
      companyId: data.companyId,
      clientId: data.clientId,
      locationName: data.locationName,
      address: data.address,
      city: data.city || null,
      province: data.province || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      panelCount: data.panelCount || 0,
      panelModel: data.panelModel || null,
      inverterModel: data.inverterModel || null,
      inverterCount: data.inverterCount || 1,
      systemPowerKw: data.systemPowerKw || null,
      installationDate: data.installationDate || null,
      status: data.status || 'pending',
      description: data.description || null,
      assignedTo: data.assignedTo || null,
      createdBy: data.createdBy,
    });

    // Auto-schedule maintenance at installationDate + 6 months
    if (installation.installationDate) {
      const maintenanceDate = new Date(installation.installationDate);
      maintenanceDate.setMonth(maintenanceDate.getMonth() + 6);

      await this.maintenanceRepository.create({
        installationId: installation.id,
        companyId: installation.companyId,
        scheduledDate: maintenanceDate,
        completedDate: null,
        status: 'scheduled',
        maintenanceType: 'routine',
        description: 'Mantenimiento preventivo programado automáticamente (6 meses post-instalación)',
        findings: null,
        assignedTo: null,
        lastNotificationDaysBefore: null
      });
    }

    return installation;
  }
}

export class GetInstallationUseCase {
  constructor(private readonly installationRepository: IInstallationRepository) {}

  async execute(id: string, companyId: string): Promise<Installation> {
    const installation = await this.installationRepository.findByIdAndCompany(id, companyId);
    if (!installation) {
      throw new Error('INSTALLATION_NOT_FOUND');
    }
    return installation;
  }
}

interface UpdateInstallationDTO {
  id: string;
  companyId: string;
  clientId?: string;
  locationName?: string;
  address?: string;
  city?: string;
  province?: string;
  latitude?: number;
  longitude?: number;
  panelCount?: number;
  panelModel?: string;
  inverterModel?: string;
  inverterCount?: number;
  systemPowerKw?: number;
  installationDate?: Date;
  status?: InstallationStatus;
  description?: string;
  assignedTo?: string;
}

export class UpdateInstallationUseCase {
  constructor(private readonly installationRepository: IInstallationRepository) {}

  async execute(data: UpdateInstallationDTO): Promise<Installation> {
    const { id, companyId, ...updateData } = data;
    const updatedInstallation = await this.installationRepository.update(id, companyId, updateData);
    
    if (!updatedInstallation) {
      throw new Error('INSTALLATION_NOT_FOUND');
    }
    
    return updatedInstallation;
  }
}

export class DeleteInstallationUseCase {
  constructor(private readonly installationRepository: IInstallationRepository) {}

  async execute(id: string, companyId: string): Promise<void> {
    const deleted = await this.installationRepository.delete(id, companyId);
    if (!deleted) {
      throw new Error('INSTALLATION_NOT_FOUND');
    }
  }
}

export class ListInstallationsUseCase {
  constructor(private readonly installationRepository: IInstallationRepository) {}

  async execute(companyId: string, filters: any = {}, skip: number = 0, limit: number = 100): Promise<Installation[]> {
    return this.installationRepository.list(companyId, filters, skip, limit);
  }
}
