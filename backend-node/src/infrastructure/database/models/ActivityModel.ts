import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../database.config';
import { Activity } from '../../../domain/entities/Activity';
import { CompanyModel } from './CompanyModel';
import { InstallationModel } from './InstallationModel';
import { UserModel } from './UserModel';

interface ActivityCreationAttributes extends Optional<Activity, 'id' | 'createdAt' | 'activityDate'> {}

export class ActivityModel extends Model<Activity, ActivityCreationAttributes> implements Activity {
  public id!: string;
  public installationId!: string;
  public companyId!: string;
  public userId!: string | null;
  public title!: string;
  public description!: string | null;
  public activityDate!: Date;
  public durationMinutes!: number | null;
  public readonly createdAt!: Date;
}

ActivityModel.init(
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
    userId: {
      type: DataTypes.UUID,
      field: 'user_id',
      references: { model: UserModel, key: 'id' },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    activityDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'activity_date',
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      field: 'duration_minutes',
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
  },
  {
    sequelize,
    tableName: 'activities',
    timestamps: true,
    updatedAt: false,
  }
);
