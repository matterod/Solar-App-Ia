export type CostType = 'food' | 'materials' | 'vehicle' | 'lodging' | 'other';

export interface Cost {
  id: string;
  companyId: string;
  installationId: string;
  costType: CostType;
  description: string | null;
  amount: number;
  quantity: number;
  costDate: Date;
  createdBy: string | null;
  createdAt: Date;
}
