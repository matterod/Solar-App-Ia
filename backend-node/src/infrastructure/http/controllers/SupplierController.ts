import { Request, Response } from 'express';
import { 
  CreateSupplierUseCase, 
  GetSupplierUseCase, 
  UpdateSupplierUseCase, 
  DeleteSupplierUseCase, 
  ListSuppliersUseCase 
} from '../../../application/use-cases/SupplierUseCases';

export class SupplierController {
  constructor(
    private readonly createSupplierUseCase: CreateSupplierUseCase,
    private readonly getSupplierUseCase: GetSupplierUseCase,
    private readonly updateSupplierUseCase: UpdateSupplierUseCase,
    private readonly deleteSupplierUseCase: DeleteSupplierUseCase,
    private readonly listSuppliersUseCase: ListSuppliersUseCase
  ) {}

  async listSuppliers(req: Request, res: Response) {
    try {
      const skip = parseInt(req.query.skip as string) || 0;
      const limit = parseInt(req.query.limit as string) || 100;
      const companyId = req.current_user.company_id;
      const search = req.query.search ? (req.query.search as string) : null;

      const suppliers = await this.listSuppliersUseCase.execute(companyId, search, skip, limit);
      res.json(suppliers);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async getSupplier(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const companyId = req.current_user.company_id;

      const supplier = await this.getSupplierUseCase.execute(id, companyId);
      res.json(supplier);
    } catch (error: any) {
      if (error.message === 'SUPPLIER_NOT_FOUND') {
        return res.status(404).json({ detail: 'Proveedor no encontrado' });
      }
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async createSupplier(req: Request, res: Response) {
    try {
      const companyId = req.current_user.company_id;
      
      const supplier = await this.createSupplierUseCase.execute({
        ...req.body,
        companyId,
      });

      res.status(201).json(supplier);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async updateSupplier(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const companyId = req.current_user.company_id;

      const supplier = await this.updateSupplierUseCase.execute({
        id,
        companyId,
        ...req.body,
      });

      res.json(supplier);
    } catch (error: any) {
      if (error.message === 'SUPPLIER_NOT_FOUND') {
        return res.status(404).json({ detail: 'Proveedor no encontrado' });
      }
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  async deleteSupplier(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const companyId = req.current_user.company_id;

      await this.deleteSupplierUseCase.execute(id, companyId);
      res.status(204).send();
    } catch (error: any) {
      if (error.message === 'SUPPLIER_NOT_FOUND') {
        return res.status(404).json({ detail: 'Proveedor no encontrado' });
      }
      console.error(error);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }
}
