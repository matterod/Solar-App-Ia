import { IActivityRepository } from '../../domain/repositories/IActivityRepository';
import { Activity } from '../../domain/entities/Activity';

interface CreateActivityDTO {
  installationId: string;
  companyId: string;
  userId: string;
  title: string;
  description?: string;
  activityDate?: Date;
  durationMinutes?: number;
}

export class CreateActivityUseCase {
  constructor(private readonly activityRepository: IActivityRepository) {}

  async execute(data: CreateActivityDTO): Promise<Activity> {
    return this.activityRepository.create({
      installationId: data.installationId,
      companyId: data.companyId,
      userId: data.userId,
      title: data.title,
      description: data.description || null,
      activityDate: data.activityDate || new Date(),
      durationMinutes: data.durationMinutes || null,
    });
  }
}

export class GetActivityUseCase {
  constructor(private readonly activityRepository: IActivityRepository) {}

  async execute(id: string, companyId: string): Promise<Activity> {
    const activity = await this.activityRepository.findByIdAndCompany(id, companyId);
    if (!activity) {
      throw new Error('ACTIVITY_NOT_FOUND');
    }
    return activity;
  }
}

interface UpdateActivityDTO {
  id: string;
  companyId: string;
  title?: string;
  description?: string;
  activityDate?: Date;
  durationMinutes?: number;
}

export class UpdateActivityUseCase {
  constructor(private readonly activityRepository: IActivityRepository) {}

  async execute(data: UpdateActivityDTO): Promise<Activity> {
    const { id, companyId, ...updateData } = data;
    const updatedActivity = await this.activityRepository.update(id, companyId, updateData);
    
    if (!updatedActivity) {
      throw new Error('ACTIVITY_NOT_FOUND');
    }
    
    return updatedActivity;
  }
}

export class DeleteActivityUseCase {
  constructor(private readonly activityRepository: IActivityRepository) {}

  async execute(id: string, companyId: string): Promise<void> {
    const deleted = await this.activityRepository.delete(id, companyId);
    if (!deleted) {
      throw new Error('ACTIVITY_NOT_FOUND');
    }
  }
}

export class ListActivitiesUseCase {
  constructor(private readonly activityRepository: IActivityRepository) {}

  async execute(companyId: string, filters: any = {}, skip: number = 0, limit: number = 100): Promise<Activity[]> {
    return this.activityRepository.list(companyId, filters, skip, limit);
  }
}
