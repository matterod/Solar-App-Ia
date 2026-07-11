import { Router, Request, Response } from 'express';
import { getCurrentUser } from '../middlewares/auth.middleware';

const router = Router();

router.get('/me', getCurrentUser, (req: Request, res: Response) => {
  // auth.middleware.ts attaches the exact shape of UserRead to req.current_user
  res.json(req.current_user);
});

export default router;
