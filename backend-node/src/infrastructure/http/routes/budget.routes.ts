import { Router } from 'express';
import { BudgetController } from '../controllers/BudgetController';
import { getCurrentUser } from '../middlewares/auth.middleware';
import { SequelizeBudgetRepository } from '../../repositories/SequelizeBudgetRepository';
import { 
  CreateBudgetUseCase, 
  GetBudgetUseCase, 
  UpdateBudgetUseCase, 
  DeleteBudgetUseCase, 
  ListBudgetsUseCase,
  UpdateBudgetStatusUseCase,
  DuplicateBudgetUseCase
} from '../../../application/use-cases/BudgetUseCases';

const router = Router();

// DI Setup
const budgetRepo = new SequelizeBudgetRepository();
const createBudgetUseCase = new CreateBudgetUseCase(budgetRepo);
const getBudgetUseCase = new GetBudgetUseCase(budgetRepo);
const updateBudgetUseCase = new UpdateBudgetUseCase(budgetRepo);
const deleteBudgetUseCase = new DeleteBudgetUseCase(budgetRepo);
const listBudgetsUseCase = new ListBudgetsUseCase(budgetRepo);
const updateBudgetStatusUseCase = new UpdateBudgetStatusUseCase(budgetRepo);
const duplicateBudgetUseCase = new DuplicateBudgetUseCase(budgetRepo);

const budgetController = new BudgetController(
  createBudgetUseCase,
  getBudgetUseCase,
  updateBudgetUseCase,
  deleteBudgetUseCase,
  listBudgetsUseCase,
  updateBudgetStatusUseCase,
  duplicateBudgetUseCase
);

router.use(getCurrentUser); // Require auth for all budget routes

router.get('/', (req, res) => budgetController.listBudgets(req, res));
router.get('/:id', (req, res) => budgetController.getBudget(req, res));
router.post('/', (req, res) => budgetController.createBudget(req, res));
router.put('/:id', (req, res) => budgetController.updateBudget(req, res));
router.delete('/:id', (req, res) => budgetController.deleteBudget(req, res));
router.patch('/:id/status', (req, res) => budgetController.updateBudgetStatus(req, res));
router.post('/:id/duplicate', (req, res) => budgetController.duplicateBudget(req, res));
router.get('/:id/pdf', (req, res) => budgetController.getBudgetPdf(req, res));

export default router;
