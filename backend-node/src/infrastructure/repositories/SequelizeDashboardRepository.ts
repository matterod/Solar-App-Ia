import { Op } from 'sequelize';
import { IDashboardRepository, DashboardStats } from '../../domain/repositories/IDashboardRepository';
import { ClientModel } from '../database/models/ClientModel';
import { InstallationModel } from '../database/models/InstallationModel';
import { MaintenanceModel } from '../database/models/MaintenanceModel';
import { ProductModel } from '../database/models/ProductModel';
import { PendingTaskModel } from '../database/models/PendingTaskModel';
import { sequelize } from '../database/database.config';

export class SequelizeDashboardRepository implements IDashboardRepository {
  async getStats(companyId: string): Promise<DashboardStats> {
    // 1. Total clients
    const totalClients = await ClientModel.count({ where: { companyId } });

    // 2. Installations counts
    const totalInstallations = await InstallationModel.count({ where: { companyId } });
    
    const activeInstallations = await InstallationModel.count({
      where: {
        companyId,
        status: {
          [Op.in]: ['in_progress', 'completed']
        }
      }
    });

    // 3. Total System Power (summing systemPowerKw)
    const powerSum = await InstallationModel.sum('systemPowerKw', {
      where: { companyId }
    });
    const totalPowerKw = powerSum || 0;

    // 4. Upcoming Maintenance (next 30 days)
    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);

    const upcomingMaintenance = await MaintenanceModel.count({
      where: {
        companyId, // MaintenanceModel has companyId natively!
        scheduledDate: {
          [Op.gte]: today,
          [Op.lte]: next30Days
        },
        status: 'scheduled'
      }
    });

    // 5. Pending Tasks
    const pendingTasks = await PendingTaskModel.count({
      where: {
        companyId,
        status: 'pending'
      }
    });

    // 6. Low stock products
    const lowStockProducts = await ProductModel.count({
      where: {
        companyId,
        isActive: true,
        currentStock: {
          [Op.lte]: sequelize.col('min_stock')
        }
      }
    });

    return {
      totalClients,
      totalInstallations,
      activeInstallations,
      totalPowerKw: parseFloat(totalPowerKw.toString()),
      upcomingMaintenance,
      pendingTasks,
      lowStockProducts
    };
  }
}
