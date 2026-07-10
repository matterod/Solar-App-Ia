import { Request, Response } from 'express';
import { CreateProductUseCase, UpdateProductUseCase, ListProductsUseCase } from '../../../application/use-cases/ProductUseCases';

export class ProductController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly listProductsUseCase: ListProductsUseCase
  ) {}

  async listProducts(req: Request, res: Response) {
    try {
      const skip = parseInt(req.query.skip as string) || 0;
      const limit = parseInt(req.query.limit as string) || 100;
      const sort = (req.query.sort as string) || 'name';
      
      const filters = {
        category: req.query.category,
        search: req.query.search,
        low_stock: req.query.low_stock === 'true',
      };
      
      const companyId = req.current_user.company_id;

      const products = await this.listProductsUseCase.execute(companyId, filters, skip, limit, sort);
      res.json(products);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async createProduct(req: Request, res: Response) {
    try {
      const companyId = req.current_user.company_id;
      const product = await this.createProductUseCase.execute({
        ...req.body,
        companyId,
      });

      res.status(201).json(product);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const companyId = req.current_user.company_id;

      const product = await this.updateProductUseCase.execute({
        id,
        companyId,
        ...req.body,
      });

      res.json(product);
    } catch (error: any) {
      if (error.message === 'PRODUCT_NOT_FOUND') {
        return res.status(404).json({ detail: 'Product not found' });
      }
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }
}
