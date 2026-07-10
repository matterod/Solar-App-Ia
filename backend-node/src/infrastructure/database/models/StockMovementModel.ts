import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../database.config';
import { StockMovement, StockMovementType } from '../../../domain/entities/StockMovement';
import { CompanyModel } from './CompanyModel';
import { ProductModel } from './ProductModel';
import { UserModel } from './UserModel';
import { InstallationModel } from './InstallationModel';

interface StockMovementCreationAttributes extends Optional<StockMovement, 'id' | 'createdAt'> {}

export class StockMovementModel extends Model<StockMovement, StockMovementCreationAttributes> implements StockMovement {
  public id!: string;
  public companyId!: string;
  public productId!: string;
  public installationId!: string | null;
  public movementType!: StockMovementType;
  public quantity!: number;
  public notes!: string | null;
  public createdBy!: string | null;
  public readonly createdAt!: Date;
}

StockMovementModel.init(
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
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'product_id',
      references: { model: ProductModel, key: 'id' },
      onDelete: 'CASCADE'
    },
    installationId: {
      type: DataTypes.UUID,
      field: 'installation_id',
      references: { model: InstallationModel, key: 'id' },
    },
    movementType: {
      type: DataTypes.ENUM('incoming', 'outgoing'),
      allowNull: false,
      field: 'movement_type',
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('quantity' as any);
        return value === null ? null : parseFloat(value);
      }
    },
    notes: {
      type: DataTypes.TEXT,
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
    tableName: 'stock_movements',
    timestamps: true,
    updatedAt: false,
  }
);
