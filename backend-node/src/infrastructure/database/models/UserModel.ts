import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../database.config';
import { User, UserRole } from '../../../domain/entities/User';

interface UserCreationAttributes extends Optional<User, 'id' | 'role' | 'isActive' | 'isSuperadmin' | 'messageCount' | 'createdAt' | 'updatedAt'> {}

export class UserModel extends Model<User, UserCreationAttributes> implements User {
  public id!: string;
  public companyId!: string;
  public firebaseUid!: string;
  public email!: string;
  public fullName!: string;
  public role!: UserRole;
  public isActive!: boolean;
  public isSuperadmin!: boolean;
  public phone?: string;
  public avatarUrl?: string;
  public messageCount!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public company?: any;
}

UserModel.init(
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
    },
    firebaseUid: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
      field: 'firebase_uid',
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    fullName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'full_name',
    },
    role: {
      type: DataTypes.ENUM('admin', 'partner', 'installer', 'accountant'),
      allowNull: false,
      defaultValue: 'installer',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
    isSuperadmin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_superadmin',
    },
    phone: {
      type: DataTypes.STRING(50),
    },
    avatarUrl: {
      type: DataTypes.STRING,
      field: 'avatar_url',
    },
    messageCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'message_count',
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
    tableName: 'users',
    timestamps: true,
  }
);
