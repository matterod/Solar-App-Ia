export type BudgetStatus = 'draft' | 'sent' | 'approved' | 'rejected';

export interface BudgetItem {
  id: string;
  budgetId: string;
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  sortOrder: number;
}

export interface Budget {
  id: string;
  companyId: string;
  clientId: string | null;
  installationId: string | null;
  budgetNumber: string | null;
  title: string;
  description: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: BudgetStatus;
  validUntil: Date | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  items?: BudgetItem[];
}
