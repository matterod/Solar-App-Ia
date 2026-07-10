import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../database.config';
import { Installation, InstallationStatus } from '../../../domain/entities/Installation';
import { CompanyModel } from './CompanyModel';
import { ClientModel } from './ClientModel';
import { UserModel } from './UserModel';

interface InstallationCreationAttributes extends Optional<Installation, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'panelCount' | 'inverterCount'> {}

export class InstallationModel extends Model<Installation, InstallationCreationAttributes> implements Installation {
  public id!: string;
  public companyId!: string;
  public clientId!: string;
  public locationName!: string;
  public address!: string;
  public city!: string | null;
  public province!: string | null;
  public latitude!: number | null;
  public longitude!: number | null;
  public panelCount!: number;
  public panelModel!: string | null;
  public inverterModel!: string | null;
  public inverterCount!: number;
  public systemPowerKw!: number | null;
  public installationDate!: Date | null;
  public status!: InstallationStatus;
  public description!: string | null;
  public assignedTo!: string | null;
  public createdBy!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

InstallationModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'company_id',
      references: { model: CompanyModel, key: 'id' },
      onDelete: 'CASCADE'
    },
    clientId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'client_id',
      references: { model: ClientModel, key: 'id' },
      onDelete: 'CASCADE'
    },
    locationName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'location_name',
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(100),
    },
    province: {
      type: DataTypes.STRING(100),
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      get() {
        const value = this.getDataValue('latitude' as any);
        return value === null ? null : parseFloat(value);
      }
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      get() {
        const value = this.getDataValue('longitude' as any);
        return value === null ? null : parseFloat(value);
      }
    },
    panelCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'panel_count',
    },
    panelModel: {
      type: DataTypes.STRING(255),
      field: 'panel_model',
    },
    inverterModel: {
      type: DataTypes.STRING(255),
      field: 'inverter_model',
    },
    inverterCount: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      field: 'inverter_count',
    },
    systemPowerKw: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'system_power_kw',
      get() {
        const value = this.getDataValue('systemPowerKw' as any);
        return value === null ? null : parseFloat(value);
      }
    },
    installationDate: {
      type: DataTypes.DATEONLY,
      field: 'installation_date',
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'maintenance', 'inactive'),
      allowNull: false,
      defaultValue: 'pending',
    },
    description: {
      type: DataTypes.TEXT,
    },
    assignedTo: {
      type: DataTypes.UUID,
      field: 'assigned_to',
      references: { model: UserModel, key: 'id' },
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
    tableName: 'installations',
    timestamps: true,
  }
);
