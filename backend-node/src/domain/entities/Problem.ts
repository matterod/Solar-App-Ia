export type ProblemStatus = 'open' | 'resolved' | 'ignored';

export interface Problem {
  id: string;
  companyId: string;
  title: string;
  description: string;
  status: ProblemStatus;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Solution {
  id: string;
  problemId: string;
  description: string;
  createdAt: Date;
}
