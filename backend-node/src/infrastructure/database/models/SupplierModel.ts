import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../database.config';
import { Supplier } from '../../../domain/entities/Supplier';
import { CompanyModel } from './CompanyModel';

interface SupplierCreationAttributes extends Optional<Supplier, 'id' | 'createdAt' | 'updatedAt'> {}

export class SupplierModel extends Model<Supplier, SupplierCreationAttributes> implements Supplier {
  public id!: string;
  public companyId!: string;
  public name!: string;
  public contactName!: string | null;
  public email!: string | null;
  public phone!: string | null;
  public address!: string | null;
  public taxId!: string | null;
  public notes!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SupplierModel.init(
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    contactName: {
      type: DataTypes.STRING(255),
      field: 'contact_name',
    },
    email: {
      type: DataTypes.STRING(255),
    },
    phone: {
      type: DataTypes.STRING(50),
    },
    address: {
      type: DataTypes.TEXT,
    },
    taxId: {
      type: DataTypes.STRING(50),
      field: 'tax_id',
    },
    notes: {
      type: DataTypes.TEXT,
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
    tableName: 'suppliers',
    timestamps: true,
  }
);
