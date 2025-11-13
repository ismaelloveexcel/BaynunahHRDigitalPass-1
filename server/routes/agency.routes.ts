import express from 'express';
import { db } from '../db/index.js';
import { agencies, candidates } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { hasRole } from '../middleware/auth.js';

const router = express.Router();

// Get agency profile and submissions
router.get('/profile', hasRole('agency'), async (req, res) => {
  try {
    const user = req.user as any;

    const agency = await db.query.agencies.findFirst({
      where: eq(agencies.userId, user.id),
    });

    if (!agency) {
      return res.status(404).json({ error: 'Agency not found' });
    }

    const submissions = await db.query.candidates.findMany({
      where: eq(candidates.agencyId, user.id),
      with: {
        applications: {
          with: {
            job: true,
          },
        },
      },
    });

    res.json({ agency, submissions });
  } catch (error) {
    console.error('Get agency profile error:', error);
    res.status(500).json({ error: 'Failed to get agency profile' });
  }
});

export default router;
