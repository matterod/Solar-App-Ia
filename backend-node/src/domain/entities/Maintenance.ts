export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface Maintenance {
  id: string;
  installationId: string;
  companyId: string;
  scheduledDate: Date;
  completedDate: Date | null;
  status: MaintenanceStatus;
  maintenanceType: string;
  description: string | null;
  findings: string | null;
  assignedTo: string | null;
  lastNotificationDaysBefore: number | null;
  createdAt: Date;
  updatedAt: Date;
}
