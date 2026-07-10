export type SubscriptionPlan = 'demo' | 'pro';
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled';

export interface Company {
  id: string;
  name: string;
  plan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  createdAt: Date;
  updatedAt: Date;
}
