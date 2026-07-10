import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../database.config';
import { Problem, Solution, ProblemStatus } from '../../../domain/entities/Problem';
import { CompanyModel } from './CompanyModel';

// Problem Model
interface ProblemCreationAttributes extends Optional<Problem, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'tags'> {}

export class ProblemModel extends Model<Problem, ProblemCreationAttributes> implements Problem {
  public id!: string;
  public companyId!: string;
  public title!: string;
  public description!: string;
  public status!: ProblemStatus;
  public tags!: string[];
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public solutions?: SolutionModel[];
}

ProblemModel.init(
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
    title: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('open', 'resolved', 'ignored'),
      allowNull: false,
      defaultValue: 'open',
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
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
    tableName: 'problem', // Matching python tablename exactly
    timestamps: true,
  }
);

// Solution Model
interface SolutionCreationAttributes extends Optional<Solution, 'id' | 'createdAt'> {}

export class SolutionModel extends Model<Solution, SolutionCreationAttributes> implements Solution {
  public id!: string;
  public problemId!: string;
  public description!: string;
  public readonly createdAt!: Date;
}

SolutionModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    problemId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'problem_id',
      references: { model: ProblemModel, key: 'id' },
      onDelete: 'CASCADE',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
  },
  {
    sequelize,
    tableName: 'solution', // Matching python tablename exactly
    timestamps: true,
    updatedAt: false,
  }
);
