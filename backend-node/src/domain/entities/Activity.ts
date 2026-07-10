export interface Activity {
  id: string;
  installationId: string;
  companyId: string;
  userId: string | null;
  title: string;
  description: string | null;
  activityDate: Date;
  durationMinutes: number | null;
  createdAt: Date;
}
