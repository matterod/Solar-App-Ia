export interface Product {
  id: string;
  companyId: string;
  name: string;
  sku: string | null;
  description: string | null;
  category: string | null;
  unit: string;
  currentStock: number;
  minStock: number;
  unitCost: number | null;
  salePrice: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
