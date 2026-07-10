export type UserRole = 'admin' | 'partner' | 'installer' | 'accountant';

export interface User {
  id: string;
  companyId: string;
  firebaseUid: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  isSuperadmin: boolean;
  phone?: string;
  avatarUrl?: string;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}
