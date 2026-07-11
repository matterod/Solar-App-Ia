import { Router, Request, Response } from 'express';
import { getCurrentUser } from '../middlewares/auth.middleware';
import { UserModel } from '../../database/models/UserModel';

const router = Router();

router.get('/', getCurrentUser, async (req: Request, res: Response) => {
  try {
    const users = await UserModel.findAll({
      where: { companyId: req.current_user.company_id },
      order: [
        ['role', 'ASC'],
        ['fullName', 'ASC']
      ]
    });
    
    // Map to camelCase for the new standard
    const response = users.map(user => ({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    }));
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ detail: 'Error fetching team members' });
  }
});

export default router;
