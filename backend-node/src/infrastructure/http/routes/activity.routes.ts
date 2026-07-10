import { Router } from 'express';
import { ActivityController } from '../controllers/ActivityController';
import { getCurrentUser } from '../middlewares/auth.middleware';
import { SequelizeActivityRepository } from '../../repositories/SequelizeActivityRepository';
import { CreateActivityUseCase, GetActivityUseCase, UpdateActivityUseCase, DeleteActivityUseCase, ListActivitiesUseCase } from '../../../application/use-cases/ActivityUseCases';

const router = Router();

// DI Setup
const activityRepo = new SequelizeActivityRepository();
const createActivityUseCase = new CreateActivityUseCase(activityRepo);
const getActivityUseCase = new GetActivityUseCase(activityRepo);
const updateActivityUseCase = new UpdateActivityUseCase(activityRepo);
const deleteActivityUseCase = new DeleteActivityUseCase(activityRepo);
const listActivitiesUseCase = new ListActivitiesUseCase(activityRepo);
const activityController = new ActivityController(
  createActivityUseCase,
  getActivityUseCase,
  updateActivityUseCase,
  deleteActivityUseCase,
  listActivitiesUseCase
);

router.use(getCurrentUser); // Require auth for all activity routes

router.get('/', (req, res) => activityController.listActivities(req, res));
router.get('/:id', (req, res) => activityController.getActivity(req, res));
router.post('/', (req, res) => activityController.createActivity(req, res));
router.put('/:id', (req, res) => activityController.updateActivity(req, res));
router.delete('/:id', (req, res) => activityController.deleteActivity(req, res));

export default router;
