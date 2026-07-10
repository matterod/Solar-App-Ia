import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../database.config';
import { CompanyInvitation, InvitationStatus } from '../../../domain/entities/CompanyInvitation';
import { UserRole } from '../../../domain/entities/User';
import { CompanyModel } from './CompanyModel';

interface CompanyInvitationCreationAttributes extends Optional<CompanyInvitation, 'id' | 'role' | 'status' | 'createdAt'> {}

export class CompanyInvitationModel extends Model<CompanyInvitation, CompanyInvitationCreationAttributes> implements CompanyInvitation {
  public id!: string;
  public companyId!: string;
  public email!: string;
  public role!: UserRole;
  public status!: InvitationStatus;
  public readonly createdAt!: Date;
}

CompanyInvitationModel.init(
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
      references: {
        model: CompanyModel,
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin', 'partner', 'installer', 'accountant'),
      allowNull: false,
      defaultValue: 'installer',
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'expired'),
      allowNull: false,
      defaultValue: 'pending',
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
  },
  {
    sequelize,
    tableName: 'company_invitations',
    timestamps: true,
    updatedAt: false, // In python model, only created_at is used
  }
);
