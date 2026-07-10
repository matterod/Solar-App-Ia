import { UserRole } from './User';

export type InvitationStatus = 'pending' | 'accepted' | 'expired';

export interface CompanyInvitation {
  id: string;
  companyId: string;
  email: string;
  role: UserRole;
  status: InvitationStatus;
  createdAt: Date;
}
