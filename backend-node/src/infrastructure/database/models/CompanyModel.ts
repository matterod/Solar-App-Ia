import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../database.config';
import { Company, SubscriptionPlan, SubscriptionStatus } from '../../../domain/entities/Company';

interface CompanyCreationAttributes extends Optional<Company, 'id' | 'plan' | 'subscriptionStatus' | 'createdAt' | 'updatedAt'> {}

export class CompanyModel extends Model<Company, CompanyCreationAttributes> implements Company {
  public id!: string;
  public name!: string;
  public plan!: SubscriptionPlan;
  public subscriptionStatus!: SubscriptionStatus;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CompanyModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    plan: {
      type: DataTypes.ENUM('demo', 'pro'),
      allowNull: false,
      defaultValue: 'demo',
    },
    subscriptionStatus: {
      type: DataTypes.ENUM('active', 'inactive', 'cancelled'),
      allowNull: false,
      defaultValue: 'active',
      field: 'subscription_status',
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
    tableName: 'companies',
    timestamps: true,
  }
);
