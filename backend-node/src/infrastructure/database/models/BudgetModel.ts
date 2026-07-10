import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../database.config';
import { Budget, BudgetStatus, BudgetItem } from '../../../domain/entities/Budget';
import { CompanyModel } from './CompanyModel';
import { ClientModel } from './ClientModel';
import { InstallationModel } from './InstallationModel';
import { UserModel } from './UserModel';
import { ProductModel } from './ProductModel';

// Budget Model Setup
interface BudgetCreationAttributes extends Optional<Budget, 'id' | 'createdAt' | 'updatedAt' | 'subtotal' | 'taxRate' | 'taxAmount' | 'total' | 'status'> {}

export class BudgetModel extends Model<Budget, BudgetCreationAttributes> implements Budget {
  public id!: string;
  public companyId!: string;
  public clientId!: string | null;
  public installationId!: string | null;
  public budgetNumber!: string | null;
  public title!: string;
  public description!: string | null;
  public subtotal!: number;
  public taxRate!: number;
  public taxAmount!: number;
  public total!: number;
  public status!: BudgetStatus;
  public validUntil!: Date | null;
  public notes!: string | null;
  public createdBy!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  
  public items?: BudgetItem[];
}

BudgetModel.init(
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
    clientId: {
      type: DataTypes.UUID,
      field: 'client_id',
      references: { model: ClientModel, key: 'id' },
      onDelete: 'SET NULL',
    },
    installationId: {
      type: DataTypes.UUID,
      field: 'installation_id',
      references: { model: InstallationModel, key: 'id' },
      onDelete: 'CASCADE',
    },
    budgetNumber: {
      type: DataTypes.STRING(50),
      unique: true,
      field: 'budget_number',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      get() {
        const rawValue = this.getDataValue('subtotal');
        return rawValue === null ? null : parseFloat(rawValue as unknown as string);
      },
    },
    taxRate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 21.00,
      field: 'tax_rate',
      get() {
        const rawValue = this.getDataValue('taxRate');
        return rawValue === null ? null : parseFloat(rawValue as unknown as string);
      },
    },
    taxAmount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'tax_amount',
      get() {
        const rawValue = this.getDataValue('taxAmount');
        return rawValue === null ? null : parseFloat(rawValue as unknown as string);
      },
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      get() {
        const rawValue = this.getDataValue('total');
        return rawValue === null ? null : parseFloat(rawValue as unknown as string);
      },
    },
    status: {
      type: DataTypes.ENUM('draft', 'sent', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'draft',
    },
    validUntil: {
      type: DataTypes.DATEONLY,
      field: 'valid_until',
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
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'budgets',
    timestamps: true,
  }
);

// BudgetItem Model Setup
interface BudgetItemCreationAttributes extends Optional<BudgetItem, 'id' | 'quantity' | 'unitPrice' | 'total' | 'sortOrder'> {}

export class BudgetItemModel extends Model<BudgetItem, BudgetItemCreationAttributes> implements BudgetItem {
  public id!: string;
  public budgetId!: string;
  public productId!: string | null;
  public description!: string;
  public quantity!: number;
  public unitPrice!: number;
  public total!: number;
  public sortOrder!: number;
}

BudgetItemModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    budgetId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'budget_id',
      references: { model: BudgetModel, key: 'id' },
      onDelete: 'CASCADE',
    },
    productId: {
      type: DataTypes.UUID,
      field: 'product_id',
      references: { model: ProductModel, key: 'id' },
      onDelete: 'SET NULL',
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 1,
      get() {
        const rawValue = this.getDataValue('quantity');
        return rawValue === null ? null : parseFloat(rawValue as unknown as string);
      },
    },
    unitPrice: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'unit_price',
      get() {
        const rawValue = this.getDataValue('unitPrice');
        return rawValue === null ? null : parseFloat(rawValue as unknown as string);
      },
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      get() {
        const rawValue = this.getDataValue('total');
        return rawValue === null ? null : parseFloat(rawValue as unknown as string);
      },
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'sort_order',
    },
  },
  {
    sequelize,
    tableName: 'budget_items',
    timestamps: false,
  }
);
