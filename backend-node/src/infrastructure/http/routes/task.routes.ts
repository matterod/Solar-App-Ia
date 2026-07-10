import { Router } from 'express';
import { PendingTaskController } from '../controllers/PendingTaskController';
import { getCurrentUser } from '../middlewares/auth.middleware';
import { SequelizePendingTaskRepository } from '../../repositories/SequelizePendingTaskRepository';
import { 
  CreatePendingTaskUseCase, 
  GetPendingTaskUseCase, 
  UpdatePendingTaskUseCase, 
  DeletePendingTaskUseCase, 
  ListPendingTasksUseCase 
} from '../../../application/use-cases/PendingTaskUseCases';

const router = Router();

// DI Setup
const pendingTaskRepo = new SequelizePendingTaskRepository();
const createPendingTaskUseCase = new CreatePendingTaskUseCase(pendingTaskRepo);
const getPendingTaskUseCase = new GetPendingTaskUseCase(pendingTaskRepo);
const updatePendingTaskUseCase = new UpdatePendingTaskUseCase(pendingTaskRepo);
const deletePendingTaskUseCase = new DeletePendingTaskUseCase(pendingTaskRepo);
const listPendingTasksUseCase = new ListPendingTasksUseCase(pendingTaskRepo);

const pendingTaskController = new PendingTaskController(
  createPendingTaskUseCase,
  getPendingTaskUseCase,
  updatePendingTaskUseCase,
  deletePendingTaskUseCase,
  listPendingTasksUseCase
);

router.use(getCurrentUser); // Require auth

router.get('/', (req, res) => pendingTaskController.listTasks(req, res));
router.get('/:id', (req, res) => pendingTaskController.getTask(req, res));
router.post('/', (req, res) => pendingTaskController.createTask(req, res));
router.put('/:id', (req, res) => pendingTaskController.updateTask(req, res));
router.delete('/:id', (req, res) => pendingTaskController.deleteTask(req, res));

export default router;
