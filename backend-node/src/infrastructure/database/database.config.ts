import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const rawDbUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/solar_erp';
const dbUrl = rawDbUrl.replace('postgresql+asyncpg://', 'postgres://').split('?')[0];

export const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  logging: false, // Set to console.log to see SQL queries
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});
