import { ISupplierRepository } from '../../domain/repositories/ISupplierRepository';
import { Supplier } from '../../domain/entities/Supplier';

interface CreateSupplierDTO {
  companyId: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  notes?: string;
}

export class CreateSupplierUseCase {
  constructor(private readonly supplierRepository: ISupplierRepository) {}

  async execute(data: CreateSupplierDTO): Promise<Supplier> {
    return this.supplierRepository.create({
      companyId: data.companyId,
      name: data.name,
      contactName: data.contactName || null,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      taxId: data.taxId || null,
      notes: data.notes || null,
    });
  }
}

export class GetSupplierUseCase {
  constructor(private readonly supplierRepository: ISupplierRepository) {}

  async execute(id: string, companyId: string): Promise<Supplier> {
    const supplier = await this.supplierRepository.findByIdAndCompany(id, companyId);
    if (!supplier) {
      throw new Error('SUPPLIER_NOT_FOUND');
    }
    return supplier;
  }
}

interface UpdateSupplierDTO {
  id: string;
  companyId: string;
  name?: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  taxId?: string | null;
  notes?: string | null;
}

export class UpdateSupplierUseCase {
  constructor(private readonly supplierRepository: ISupplierRepository) {}

  async execute(data: UpdateSupplierDTO): Promise<Supplier> {
    const { id, companyId, ...updateData } = data;
    const updatedSupplier = await this.supplierRepository.update(id, companyId, updateData);
    
    if (!updatedSupplier) {
      throw new Error('SUPPLIER_NOT_FOUND');
    }
    
    return updatedSupplier;
  }
}

export class DeleteSupplierUseCase {
  constructor(private readonly supplierRepository: ISupplierRepository) {}

  async execute(id: string, companyId: string): Promise<void> {
    const deleted = await this.supplierRepository.delete(id, companyId);
    if (!deleted) {
      throw new Error('SUPPLIER_NOT_FOUND');
    }
  }
}

export class ListSuppliersUseCase {
  constructor(private readonly supplierRepository: ISupplierRepository) {}

  async execute(companyId: string, search: string | null = null, skip: number = 0, limit: number = 100): Promise<Supplier[]> {
    return this.supplierRepository.list(companyId, search, skip, limit);
  }
}
