import { Router } from 'express';
import { MaintenanceController } from '../controllers/MaintenanceController';
import { getCurrentUser } from '../middlewares/auth.middleware';
import { SequelizeMaintenanceRepository } from '../../repositories/SequelizeMaintenanceRepository';
import { CreateMaintenanceUseCase, GetMaintenanceUseCase, UpdateMaintenanceUseCase, DeleteMaintenanceUseCase, ListMaintenancesUseCase } from '../../../application/use-cases/MaintenanceUseCases';

const router = Router();

// DI Setup
const maintenanceRepo = new SequelizeMaintenanceRepository();
const createMaintenanceUseCase = new CreateMaintenanceUseCase(maintenanceRepo);
const getMaintenanceUseCase = new GetMaintenanceUseCase(maintenanceRepo);
const updateMaintenanceUseCase = new UpdateMaintenanceUseCase(maintenanceRepo);
const deleteMaintenanceUseCase = new DeleteMaintenanceUseCase(maintenanceRepo);
const listMaintenancesUseCase = new ListMaintenancesUseCase(maintenanceRepo);
const maintenanceController = new MaintenanceController(
  createMaintenanceUseCase,
  getMaintenanceUseCase,
  updateMaintenanceUseCase,
  deleteMaintenanceUseCase,
  listMaintenancesUseCase
);

router.use(getCurrentUser); // Require auth for all maintenance routes

router.get('/', (req, res) => maintenanceController.listMaintenances(req, res));
router.get('/:id', (req, res) => maintenanceController.getMaintenance(req, res));
router.post('/', (req, res) => maintenanceController.createMaintenance(req, res));
router.put('/:id', (req, res) => maintenanceController.updateMaintenance(req, res));
router.delete('/:id', (req, res) => maintenanceController.deleteMaintenance(req, res));

export default router;
