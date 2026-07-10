import { Router } from 'express';
import { SupplierController } from '../controllers/SupplierController';
import { getCurrentUser } from '../middlewares/auth.middleware';
import { SequelizeSupplierRepository } from '../../repositories/SequelizeSupplierRepository';
import { 
  CreateSupplierUseCase, 
  GetSupplierUseCase, 
  UpdateSupplierUseCase, 
  DeleteSupplierUseCase, 
  ListSuppliersUseCase 
} from '../../../application/use-cases/SupplierUseCases';

const router = Router();

// DI Setup
const supplierRepo = new SequelizeSupplierRepository();
const createSupplierUseCase = new CreateSupplierUseCase(supplierRepo);
const getSupplierUseCase = new GetSupplierUseCase(supplierRepo);
const updateSupplierUseCase = new UpdateSupplierUseCase(supplierRepo);
const deleteSupplierUseCase = new DeleteSupplierUseCase(supplierRepo);
const listSuppliersUseCase = new ListSuppliersUseCase(supplierRepo);

const supplierController = new SupplierController(
  createSupplierUseCase,
  getSupplierUseCase,
  updateSupplierUseCase,
  deleteSupplierUseCase,
  listSuppliersUseCase
);

router.use(getCurrentUser); // Require auth

router.get('/', (req, res) => supplierController.listSuppliers(req, res));
router.get('/:id', (req, res) => supplierController.getSupplier(req, res));
router.post('/', (req, res) => supplierController.createSupplier(req, res));
router.put('/:id', (req, res) => supplierController.updateSupplier(req, res));
router.delete('/:id', (req, res) => supplierController.deleteSupplier(req, res));

export default router;
