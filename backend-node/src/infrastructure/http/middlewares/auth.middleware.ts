import { Request, Response, NextFunction } from 'express';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import path from 'path';
import { UserModel } from '../../database/models/UserModel';
import { CompanyModel } from '../../database/models/CompanyModel';
import { CompanyInvitationModel } from '../../database/models/CompanyInvitationModel';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    const serviceAccountPath = path.resolve(__dirname, '../../../../../serviceAccountKey.json');
    initializeApp({
      credential: cert(serviceAccountPath),
    });
  } catch (error) {
    // Fallback: use project ID to verify tokens without full credentials
    initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'solarsystem-2186e'
    });
  }
}

// Extend Express Request object to include current_user
declare global {
  namespace Express {
    interface Request {
      current_user?: any;
    }
  }
}

export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Could not validate credentials' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email;
    const name = decodedToken.name || email?.split('@')[0];

    if (!firebaseUid || !email) {
      return res.status(401).json({ detail: 'Could not validate credentials' });
    }

    // Find user in DB including company
    let user = await UserModel.findOne({
      where: { firebaseUid },
      include: [{ model: CompanyModel, as: 'company' }],
    });

    if (!user) {
      // First time login — check for pending invitations
      const invitation = await CompanyInvitationModel.findOne({
        where: { email, status: 'pending' },
      });

      if (invitation) {
        // Join the invited company
        user = await UserModel.create({
          firebaseUid,
          email,
          fullName: name || 'User',
          companyId: invitation.companyId,
          role: invitation.role,
        });
        await invitation.update({ status: 'accepted' });
        
        // Re-fetch with company
        user = await UserModel.findOne({
          where: { id: user.id },
          include: [{ model: CompanyModel, as: 'company' }],
        });
      } else {
        // No invitation — create a new demo company
        const newCompany = await CompanyModel.create({
          name: `Demo de ${name}`,
          plan: 'demo',
        });

        user = await UserModel.create({
          firebaseUid,
          email,
          fullName: name || 'User',
          companyId: newCompany.id,
          role: 'admin',
        });
        
        user.company = newCompany as any;
      }
    }

    if (!user?.isActive) {
      return res.status(400).json({ detail: 'Inactive user' });
    }

    // Attach user to request in the exact shape the frontend expects (camelCase)
    // while also keeping snake_case for backward compatibility with backend controllers.
    req.current_user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      full_name: user.fullName,
      role: user.role,
      companyId: user.companyId,
      company_id: user.companyId,
      companyName: (user as any).company?.name || null,
      company_name: (user as any).company?.name || null,
      plan: (user as any).company?.plan || null,
      isSuperadmin: user.isSuperadmin,
      is_superadmin: user.isSuperadmin,
      aiQuestionsUsed: user.messageCount,
      ai_questions_used: user.messageCount,
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ detail: 'Could not validate credentials' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.current_user) {
      return res.status(401).json({ detail: 'Not authenticated' });
    }
    
    if (!roles.includes(req.current_user.role)) {
      return res.status(403).json({ detail: 'Insufficient permissions' });
    }
    
    next();
  };
};
