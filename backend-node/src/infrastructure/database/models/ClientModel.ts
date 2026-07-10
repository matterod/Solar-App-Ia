import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../database.config';
import { Client } from '../../../domain/entities/Client';
import { CompanyModel } from './CompanyModel';
import { UserModel } from './UserModel';

interface ClientCreationAttributes extends Optional<Client, 'id' | 'createdAt' | 'updatedAt'> {}

export class ClientModel extends Model<Client, ClientCreationAttributes> implements Client {
  public id!: string;
  public companyId!: string;
  public name!: string;
  public email!: string | null;
  public phone!: string | null;
  public company!: string | null;
  public taxId!: string | null;
  public address!: string | null;
  public city!: string | null;
  public province!: string | null;
  public notes!: string | null;
  public createdBy!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ClientModel.init(
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
    email: {
      type: DataTypes.STRING(255),
    },
    phone: {
      type: DataTypes.STRING(50),
    },
    company: {
      type: DataTypes.STRING(255),
    },
    taxId: {
      type: DataTypes.STRING(50),
      field: 'tax_id',
    },
    address: {
      type: DataTypes.TEXT,
    },
    city: {
      type: DataTypes.STRING(100),
    },
    province: {
      type: DataTypes.STRING(100),
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
    tableName: 'clients',
    timestamps: true,
  }
);
