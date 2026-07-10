import { Router } from 'express';
import { StockController } from '../controllers/StockController';
import { getCurrentUser } from '../middlewares/auth.middleware';
import { SequelizeStockMovementRepository } from '../../repositories/SequelizeStockMovementRepository';
import { SequelizeProductRepository } from '../../repositories/SequelizeProductRepository';
import { CreateStockMovementUseCase } from '../../../application/use-cases/CreateStockMovementUseCase';
import { ListStockMovementsUseCase } from '../../../application/use-cases/ListStockMovementsUseCase';

const router = Router();

// DI Setup
const stockMovementRepo = new SequelizeStockMovementRepository();
const productRepo = new SequelizeProductRepository();
const createStockMovementUseCase = new CreateStockMovementUseCase(stockMovementRepo, productRepo);
const listStockMovementsUseCase = new ListStockMovementsUseCase(stockMovementRepo);
const stockController = new StockController(createStockMovementUseCase, listStockMovementsUseCase);

router.use(getCurrentUser); // Require auth for all stock routes

router.get('/movements', (req, res) => stockController.listMovements(req, res));
router.post('/movements', (req, res) => stockController.createMovement(req, res));

export default router;
