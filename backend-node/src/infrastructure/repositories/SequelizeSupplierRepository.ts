import { Op } from 'sequelize';
import { Supplier } from '../../domain/entities/Supplier';
import { ISupplierRepository } from '../../domain/repositories/ISupplierRepository';
import { SupplierModel } from '../database/models/SupplierModel';

export class SequelizeSupplierRepository implements ISupplierRepository {
  async create(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
    const newSupplier = await SupplierModel.create(supplier as any);
    return newSupplier.toJSON() as Supplier;
  }

  async findByIdAndCompany(id: string, companyId: string): Promise<Supplier | null> {
    const supplier = await SupplierModel.findOne({
      where: { id, companyId },
    });
    return supplier ? supplier.toJSON() as Supplier : null;
  }

  async update(id: string, companyId: string, data: Partial<Omit<Supplier, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>>): Promise<Supplier | null> {
    const [updatedRows] = await SupplierModel.update(data, {
      where: { id, companyId },
    });
    
    if (updatedRows === 0) return null;
    return this.findByIdAndCompany(id, companyId);
  }

  async delete(id: string, companyId: string): Promise<boolean> {
    const deletedRows = await SupplierModel.destroy({
      where: { id, companyId },
    });
    return deletedRows > 0;
  }

  async list(companyId: string, search: string | null, skip: number, limit: number): Promise<Supplier[]> {
    const whereClause: any = { companyId };
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { contactName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const suppliers = await SupplierModel.findAll({
      where: whereClause,
      limit,
      offset: skip,
      order: [['name', 'ASC']],
    });
    return suppliers.map(s => s.toJSON() as Supplier);
  }
}
