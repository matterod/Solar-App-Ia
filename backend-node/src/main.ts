import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import stockRoutes from './infrastructure/http/routes/stock.routes';
import productRoutes from './infrastructure/http/routes/product.routes';
import clientRoutes from './infrastructure/http/routes/client.routes';
import installationRoutes from './infrastructure/http/routes/installation.routes';
import maintenanceRoutes from './infrastructure/http/routes/maintenance.routes';
import activityRoutes from './infrastructure/http/routes/activity.routes';
import costRoutes from './infrastructure/http/routes/cost.routes';
import budgetRoutes from './infrastructure/http/routes/budget.routes';
import dashboardRoutes from './infrastructure/http/routes/dashboard.routes';
import problemRoutes from './infrastructure/http/routes/problem.routes';
import taskRoutes from './infrastructure/http/routes/task.routes';
import supplierRoutes from './infrastructure/http/routes/supplier.routes';
import { sequelize } from './infrastructure/database/database.config';
import './infrastructure/database/models'; // Register model associations
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Basic health check routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'solar-erp-backend',
    version: '1.0.0',
    status: 'running',
    docs: '/docs',
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy' });
});

import authRoutes from './infrastructure/http/routes/auth.routes';
import planRoutes from './infrastructure/http/routes/plan.routes';
import teamRoutes from './infrastructure/http/routes/team.routes';

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/stock', stockRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/clients', clientRoutes);
app.use('/api/v1/installations', installationRoutes);
app.use('/api/v1/maintenance', maintenanceRoutes);
app.use('/api/v1/activities', activityRoutes);
app.use('/api/v1/costs', costRoutes);
app.use('/api/v1/budgets', budgetRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/problems', problemRoutes);
app.use('/api/v1/pending-tasks', taskRoutes);
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api/v1/plan', planRoutes);
app.use('/api/v1/team', teamRoutes);

// Fallback 404 JSON handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ detail: `Not Found: ${req.method} ${req.originalUrl}` });
});

async function bootstrap() {
  try {
    // Authenticate database connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Start server
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  bootstrap();
}
