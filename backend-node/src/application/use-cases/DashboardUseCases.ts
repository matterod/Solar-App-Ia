import { IDashboardRepository, DashboardStats } from '../../domain/repositories/IDashboardRepository';

export class GetDashboardStatsUseCase {
  constructor(private readonly dashboardRepository: IDashboardRepository) {}

  async execute(companyId: string): Promise<DashboardStats> {
    return this.dashboardRepository.getStats(companyId);
  }
}
