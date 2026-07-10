import { Op } from 'sequelize';
import { sequelize } from '../database/database.config';
import { Product } from '../../domain/entities/Product';
import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { ProductModel } from '../database/models/ProductModel';

export class SequelizeProductRepository implements IProductRepository {
  async findByIdAndCompany(id: string, companyId: string): Promise<Product | null> {
    const product = await ProductModel.findOne({
      where: { id, companyId },
    });
    return product ? product.toJSON() as Product : null;
  }

  async updateStock(id: string, newStock: number): Promise<void> {
    await ProductModel.update(
      { currentStock: newStock },
      { where: { id } }
    );
  }

  async create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const newProduct = await ProductModel.create(product as any);
    return newProduct.toJSON() as Product;
  }

  async update(id: string, companyId: string, data: Partial<Omit<Product, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>>): Promise<Product | null> {
    const [updatedRows] = await ProductModel.update(data, {
      where: { id, companyId },
    });
    
    if (updatedRows === 0) return null;
    return this.findByIdAndCompany(id, companyId);
  }

  async list(companyId: string, filters: any, skip: number, limit: number, sort: string): Promise<Product[]> {
    const whereClause: any = { companyId, isActive: true };
    
    if (filters.category) whereClause.category = filters.category;
    if (filters.search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${filters.search}%` } },
        { sku: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }
    if (filters.low_stock) {
      whereClause.currentStock = { [Op.lte]: sequelize.col('min_stock') }; // Using col reference to min_stock
    }

    let orderClause: any[] = [['name', 'ASC']];
    if (sort === 'price_asc') orderClause = [['unitCost', 'ASC']];
    if (sort === 'price_desc') orderClause = [['unitCost', 'DESC']];

    const products = await ProductModel.findAll({
      where: whereClause,
      limit,
      offset: skip,
      order: orderClause,
    });
    return products.map((p: any) => p.toJSON() as Product);
  }
}
