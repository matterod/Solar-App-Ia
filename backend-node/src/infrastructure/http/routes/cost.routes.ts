import { Router } from 'express';
import { CostController } from '../controllers/CostController';
import { getCurrentUser } from '../middlewares/auth.middleware';
import { SequelizeCostRepository } from '../../repositories/SequelizeCostRepository';
import { CreateCostUseCase, GetCostUseCase, UpdateCostUseCase, DeleteCostUseCase, ListCostsUseCase } from '../../../application/use-cases/CostUseCases';

const router = Router();

// DI Setup
const costRepo = new SequelizeCostRepository();
const createCostUseCase = new CreateCostUseCase(costRepo);
const getCostUseCase = new GetCostUseCase(costRepo);
const updateCostUseCase = new UpdateCostUseCase(costRepo);
const deleteCostUseCase = new DeleteCostUseCase(costRepo);
const listCostsUseCase = new ListCostsUseCase(costRepo);

const costController = new CostController(
  createCostUseCase,
  getCostUseCase,
  updateCostUseCase,
  deleteCostUseCase,
  listCostsUseCase
);

router.use(getCurrentUser); // Require auth for all cost routes

router.get('/', (req, res) => costController.listCosts(req, res));
router.get('/:id', (req, res) => costController.getCost(req, res));
router.post('/', (req, res) => costController.createCost(req, res));
router.put('/:id', (req, res) => costController.updateCost(req, res));
router.delete('/:id', (req, res) => costController.deleteCost(req, res));

export default router;
