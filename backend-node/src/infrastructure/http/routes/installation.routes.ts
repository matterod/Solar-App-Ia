import { Router } from 'express';
import { InstallationController } from '../controllers/InstallationController';
import { getCurrentUser } from '../middlewares/auth.middleware';
import { SequelizeInstallationRepository } from '../../repositories/SequelizeInstallationRepository';
import { SequelizeMaintenanceRepository } from '../../repositories/SequelizeMaintenanceRepository';
import { CreateInstallationUseCase, GetInstallationUseCase, UpdateInstallationUseCase, DeleteInstallationUseCase, ListInstallationsUseCase } from '../../../application/use-cases/InstallationUseCases';

const router = Router();

// DI Setup
const installationRepo = new SequelizeInstallationRepository();
const maintenanceRepo = new SequelizeMaintenanceRepository();
const createInstallationUseCase = new CreateInstallationUseCase(installationRepo, maintenanceRepo);
const getInstallationUseCase = new GetInstallationUseCase(installationRepo);
const updateInstallationUseCase = new UpdateInstallationUseCase(installationRepo);
const deleteInstallationUseCase = new DeleteInstallationUseCase(installationRepo);
const listInstallationsUseCase = new ListInstallationsUseCase(installationRepo);
const installationController = new InstallationController(
  createInstallationUseCase,
  getInstallationUseCase,
  updateInstallationUseCase,
  deleteInstallationUseCase,
  listInstallationsUseCase
);

router.use(getCurrentUser); // Require auth for all installation routes

router.get('/', (req, res) => installationController.listInstallations(req, res));
router.get('/:id', (req, res) => installationController.getInstallation(req, res));
router.post('/', (req, res) => installationController.createInstallation(req, res));
router.put('/:id', (req, res) => installationController.updateInstallation(req, res));
router.delete('/:id', (req, res) => installationController.deleteInstallation(req, res));

export default router;
