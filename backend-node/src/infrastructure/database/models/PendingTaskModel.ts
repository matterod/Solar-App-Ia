import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../database.config';
import { PendingTask, TaskPriority, TaskStatus, TaskType } from '../../../domain/entities/PendingTask';
import { CompanyModel } from './CompanyModel';
import { InstallationModel } from './InstallationModel';
import { UserModel } from './UserModel';

interface PendingTaskCreationAttributes extends Optional<PendingTask, 'id' | 'createdAt' | 'updatedAt' | 'priority' | 'status' | 'isRecurring'> {}

export class PendingTaskModel extends Model<PendingTask, PendingTaskCreationAttributes> implements PendingTask {
  public id!: string;
  public installationId!: string | null;
  public companyId!: string;
  public title!: string;
  public description!: string | null;
  public priority!: TaskPriority;
  public status!: TaskStatus;
  public assignedTo!: string | null;
  public dueDate!: Date | null;
  public completedAt!: Date | null;
  public taskType!: TaskType | null;
  public isRecurring!: boolean;
  public lastNotificationDaysBefore!: number | null;
  public createdBy!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PendingTaskModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    installationId: {
      type: DataTypes.UUID,
      field: 'installation_id',
      references: { model: InstallationModel, key: 'id' },
      onDelete: 'SET NULL',
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'company_id',
      references: { model: CompanyModel, key: 'id' },
      onDelete: 'CASCADE',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'medium',
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    assignedTo: {
      type: DataTypes.UUID,
      field: 'assigned_to',
      references: { model: UserModel, key: 'id' },
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      field: 'due_date',
    },
    completedAt: {
      type: DataTypes.DATE,
      field: 'completed_at',
    },
    taskType: {
      type: DataTypes.ENUM('deadline', 'recurring'),
      field: 'task_type',
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_recurring',
    },
    lastNotificationDaysBefore: {
      type: DataTypes.INTEGER,
      field: 'last_notification_days_before',
    },
    createdBy: {
      type: DataTypes.UUID,
      field: 'created_by',
      references: { model: UserModel, key: 'id' },
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
    tableName: 'pending_tasks',
    timestamps: true,
  }
);
