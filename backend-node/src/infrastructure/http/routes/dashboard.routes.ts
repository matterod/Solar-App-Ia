import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { getCurrentUser } from '../middlewares/auth.middleware';
import { SequelizeDashboardRepository } from '../../repositories/SequelizeDashboardRepository';
import { GetDashboardStatsUseCase } from '../../../application/use-cases/DashboardUseCases';

const router = Router();

// DI Setup
const dashboardRepo = new SequelizeDashboardRepository();
const getDashboardStatsUseCase = new GetDashboardStatsUseCase(dashboardRepo);
const dashboardController = new DashboardController(getDashboardStatsUseCase);

router.use(getCurrentUser); // Require auth for all dashboard routes

router.get('/stats', (req, res) => dashboardController.getStats(req, res));

export default router;
