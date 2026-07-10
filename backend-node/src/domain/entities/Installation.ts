export type InstallationStatus = 'pending' | 'in_progress' | 'completed' | 'maintenance' | 'inactive';

export interface Installation {
  id: string;
  companyId: string;
  clientId: string;
  locationName: string;
  address: string;
  city: string | null;
  province: string | null;
  latitude: number | null;
  longitude: number | null;
  panelCount: number;
  panelModel: string | null;
  inverterModel: string | null;
  inverterCount: number;
  systemPowerKw: number | null;
  installationDate: Date | null;
  status: InstallationStatus;
  description: string | null;
  assignedTo: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}
