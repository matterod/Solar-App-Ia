export interface Supplier {
  id: string;
  companyId: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  taxId: string | null; // CUIT/CUIL/RFC
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
