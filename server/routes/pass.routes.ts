import express from 'express';
import { db } from '../db/index.js';
import { candidates, employees, agencies } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Get pass by ID (public access with pass ID)
router.get('/:passId', async (req, res) => {
  try {
    const { passId } = req.params;

    // Check if it's a candidate pass
    if (passId.startsWith('BAY-')) {
      const candidate = await db.query.candidates.findFirst({
        where: eq(candidates.passId, passId),
        with: {
          user: true,
          applications: {
            with: {
              job: true,
              assessments: true,
              interviews: true,
              offer: true,
            },
          },
        },
      });

      if (candidate) {
        return res.json({ type: 'candidate', pass: candidate });
      }
    }

    // Check if it's an employee pass
    if (passId.startsWith('EMP-')) {
      const employee = await db.query.employees.findFirst({
        where: eq(employees.passId, passId),
        with: {
          user: true,
          attendance: true,
          requests: true,
        },
      });

      if (employee) {
        return res.json({ type: 'employee', pass: employee });
      }
    }

    // Check if it's an agency pass
    if (passId.startsWith('AGY-')) {
      const agency = await db.query.agencies.findFirst({
        where: eq(agencies.passId, passId),
        with: {
          user: true,
        },
      });

      if (agency) {
        const submissions = await db.query.candidates.findMany({
          where: eq(candidates.agencyId, agency.userId),
        });

        return res.json({ type: 'agency', pass: { ...agency, submissions } });
      }
    }

    res.status(404).json({ error: 'Pass not found' });
  } catch (error) {
    console.error('Get pass error:', error);
    res.status(500).json({ error: 'Failed to get pass' });
  }
});

export default router;
