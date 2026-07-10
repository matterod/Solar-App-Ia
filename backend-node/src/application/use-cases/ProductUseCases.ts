import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { Product } from '../../domain/entities/Product';

interface CreateProductDTO {
  companyId: string;
  name: string;
  sku?: string;
  description?: string;
  category?: string;
  unit?: string;
  currentStock?: number;
  minStock?: number;
  unitCost?: number;
  salePrice?: number;
}

export class CreateProductUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(data: CreateProductDTO): Promise<Product> {
    return this.productRepository.create({
      companyId: data.companyId,
      name: data.name,
      sku: data.sku || null,
      description: data.description || null,
      category: data.category || null,
      unit: data.unit || 'units',
      currentStock: data.currentStock || 0,
      minStock: data.minStock || 0,
      unitCost: data.unitCost || null,
      salePrice: data.salePrice || null,
      isActive: true,
    });
  }
}

interface UpdateProductDTO {
  id: string;
  companyId: string;
  name?: string;
  sku?: string;
  description?: string;
  category?: string;
  unit?: string;
  currentStock?: number;
  minStock?: number;
  unitCost?: number;
  salePrice?: number;
  isActive?: boolean;
}

export class UpdateProductUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(data: UpdateProductDTO): Promise<Product> {
    const { id, companyId, ...updateData } = data;
    const updatedProduct = await this.productRepository.update(id, companyId, updateData);
    
    if (!updatedProduct) {
      throw new Error('PRODUCT_NOT_FOUND');
    }
    
    return updatedProduct;
  }
}

export class ListProductsUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(companyId: string, filters: any, skip: number = 0, limit: number = 100, sort: string = 'name'): Promise<Product[]> {
    return this.productRepository.list(companyId, filters, skip, limit, sort);
  }
}
