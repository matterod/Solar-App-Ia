export type StockMovementType = 'incoming' | 'outgoing';

export interface StockMovement {
  id: string;
  companyId: string;
  productId: string;
  installationId: string | null;
  movementType: StockMovementType;
  quantity: number;
  notes: string | null;
  createdBy: string | null;
  createdAt: Date;
}
