export interface DashboardStats {
  totalClients: number;
  totalInstallations: number;
  activeInstallations: number;
  totalPowerKw: number;
  upcomingMaintenance: number;
  pendingTasks: number;
  lowStockProducts: number;
}

export interface IDashboardRepository {
  getStats(companyId: string): Promise<DashboardStats>;
}
