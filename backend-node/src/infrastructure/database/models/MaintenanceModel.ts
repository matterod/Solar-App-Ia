import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../database.config';
import { Maintenance, MaintenanceStatus } from '../../../domain/entities/Maintenance';
import { CompanyModel } from './CompanyModel';
import { InstallationModel } from './InstallationModel';
import { UserModel } from './UserModel';

interface MaintenanceCreationAttributes extends Optional<Maintenance, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'maintenanceType'> {}

export class MaintenanceModel extends Model<Maintenance, MaintenanceCreationAttributes> implements Maintenance {
  public id!: string;
  public installationId!: string;
  public companyId!: string;
  public scheduledDate!: Date;
  public completedDate!: Date | null;
  public status!: MaintenanceStatus;
  public maintenanceType!: string;
  public description!: string | null;
  public findings!: string | null;
  public assignedTo!: string | null;
  public lastNotificationDaysBefore!: number | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

MaintenanceModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    installationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'installation_id',
      references: { model: InstallationModel, key: 'id' },
      onDelete: 'CASCADE'
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'company_id',
      references: { model: CompanyModel, key: 'id' },
      onDelete: 'CASCADE'
    },
    scheduledDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'scheduled_date',
    },
    completedDate: {
      type: DataTypes.DATEONLY,
      field: 'completed_date',
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'scheduled',
    },
    maintenanceType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'routine',
      field: 'maintenance_type',
    },
    description: {
      type: DataTypes.TEXT,
    },
    findings: {
      type: DataTypes.TEXT,
    },
    assignedTo: {
      type: DataTypes.UUID,
      field: 'assigned_to',
      references: { model: UserModel, key: 'id' },
    },
    lastNotificationDaysBefore: {
      type: DataTypes.INTEGER,
      field: 'last_notification_days_before',
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'maintenance',
    timestamps: true,
  }
);
