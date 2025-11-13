import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

// Configure Passport Local Strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user) {
          return done(null, false, { message: 'Incorrect email or password' });
        }

        if (!user.isActive) {
          return done(null, false, { message: 'Account is inactive' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
          return done(null, false, { message: 'Incorrect email or password' });
        }

        // Don't send password to client
        const { password: _, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (user) {
      const { password, ...userWithoutPassword } = user;
      done(null, userWithoutPassword);
    } else {
      done(null, false);
    }
  } catch (error) {
    done(error);
  }
});

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}

// Middleware to check user role
export function hasRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = req.user as any;
    if (roles.includes(user.role)) {
      return next();
    }

    res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
  };
}

// Middleware to check if user is admin or HR
export const isAdminOrHR = hasRole('admin', 'hr');

// Middleware to check if user is manager
export const isManager = hasRole('admin', 'hr', 'manager');

export default passport;
