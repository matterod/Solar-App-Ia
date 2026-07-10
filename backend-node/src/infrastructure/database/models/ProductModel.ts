import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../database.config';
import { Product } from '../../../domain/entities/Product';
import { CompanyModel } from './CompanyModel';

interface ProductCreationAttributes extends Optional<Product, 'id' | 'unit' | 'currentStock' | 'minStock' | 'isActive' | 'createdAt' | 'updatedAt'> {}

export class ProductModel extends Model<Product, ProductCreationAttributes> implements Product {
  public id!: string;
  public companyId!: string;
  public name!: string;
  public sku!: string | null;
  public description!: string | null;
  public category!: string | null;
  public unit!: string;
  public currentStock!: number;
  public minStock!: number;
  public unitCost!: number | null;
  public salePrice!: number | null;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ProductModel.init(
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    sku: {
      type: DataTypes.STRING(100),
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
    },
    category: {
      type: DataTypes.STRING(100),
    },
    unit: {
      type: DataTypes.STRING(50),
      defaultValue: 'units',
    },
    currentStock: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'current_stock',
      get() {
        const value = this.getDataValue('currentStock' as any);
        return value === null ? null : parseFloat(value);
      }
    },
    minStock: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'min_stock',
      get() {
        const value = this.getDataValue('minStock' as any);
        return value === null ? null : parseFloat(value);
      }
    },
    unitCost: {
      type: DataTypes.DECIMAL(12, 2),
      field: 'unit_cost',
      get() {
        const value = this.getDataValue('unitCost' as any);
        return value === null ? null : parseFloat(value);
      }
    },
    salePrice: {
      type: DataTypes.DECIMAL(12, 2),
      field: 'sale_price',
      get() {
        const value = this.getDataValue('salePrice' as any);
        return value === null ? null : parseFloat(value);
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
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
    tableName: 'products',
    timestamps: true,
  }
);
