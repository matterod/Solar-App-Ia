import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';
import { getCurrentUser } from '../middlewares/auth.middleware';
import { SequelizeProductRepository } from '../../repositories/SequelizeProductRepository';
import { CreateProductUseCase, UpdateProductUseCase, ListProductsUseCase } from '../../../application/use-cases/ProductUseCases';

const router = Router();

// DI Setup
const productRepo = new SequelizeProductRepository();
const createProductUseCase = new CreateProductUseCase(productRepo);
const updateProductUseCase = new UpdateProductUseCase(productRepo);
const listProductsUseCase = new ListProductsUseCase(productRepo);
const productController = new ProductController(createProductUseCase, updateProductUseCase, listProductsUseCase);

router.use(getCurrentUser); // Require auth for all product routes

router.get('/', (req, res) => productController.listProducts(req, res));
router.post('/', (req, res) => productController.createProduct(req, res));
router.put('/:id', (req, res) => productController.updateProduct(req, res));

export default router;
