import { Router, Request, Response } from 'express';
import { getCurrentUser } from '../middlewares/auth.middleware';

const router = Router();

router.get('/usage', getCurrentUser, (req: Request, res: Response) => {
  // Temporary mock usage, we can implement real usage later
  res.json({
    plan: req.current_user?.plan || 'demo',
    aiQuestions: { used: 0, limit: 100 },
    ai_questions: { used: 0, limit: 100 }, // snake_case compatibility
    clients: { used: 0, limit: 100 },
    installations: { used: 0, limit: 100 },
    teamMembers: { used: 1, limit: 10 },
    team_members: { used: 1, limit: 10 } // snake_case compatibility
  });
});

export default router;
