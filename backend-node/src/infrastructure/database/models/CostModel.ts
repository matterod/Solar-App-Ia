import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../database.config';
import { Cost, CostType } from '../../../domain/entities/Cost';
import { CompanyModel } from './CompanyModel';
import { InstallationModel } from './InstallationModel';
import { UserModel } from './UserModel';

interface CostCreationAttributes extends Optional<Cost, 'id' | 'createdAt' | 'quantity' | 'costDate'> {}

export class CostModel extends Model<Cost, CostCreationAttributes> implements Cost {
  public id!: string;
  public companyId!: string;
  public installationId!: string;
  public costType!: CostType;
  public description!: string | null;
  public amount!: number;
  public quantity!: number;
  public costDate!: Date;
  public createdBy!: string | null;
  public readonly createdAt!: Date;
}

CostModel.init(
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
      onDelete: 'CASCADE',
    },
    installationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'installation_id',
      references: { model: InstallationModel, key: 'id' },
      onDelete: 'CASCADE',
    },
    costType: {
      type: DataTypes.ENUM('food', 'materials', 'vehicle', 'lodging', 'other'),
      allowNull: false,
      field: 'cost_type',
    },
    description: {
      type: DataTypes.STRING,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      get() {
        const rawValue = this.getDataValue('amount');
        return rawValue === null ? null : parseFloat(rawValue as unknown as string);
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    costDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'cost_date',
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
  },
  {
    sequelize,
    tableName: 'costs',
    timestamps: true,
    updatedAt: false,
  }
);
