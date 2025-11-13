import express from 'express';
import { db } from '../db/index.js';
import { applications } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Get all applications (HR/Admin)
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const user = req.user as any;
    
    if (user.role !== 'hr' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const allApplications = await db.query.applications.findMany({
      with: {
        candidate: {
          with: {
            user: {
              columns: {
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
        job: true,
        assessments: true,
        interviews: true,
      },
    });

    res.json({ applications: allApplications });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Failed to get applications' });
  }
});

// Get single application
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const application = await db.query.applications.findFirst({
      where: eq(applications.id, parseInt(req.params.id)),
      with: {
        candidate: {
          with: {
            user: true,
          },
        },
        job: true,
        assessments: true,
        interviews: true,
        offer: true,
      },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ application });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ error: 'Failed to get application' });
  }
});

// Update application status
router.patch('/:id/status', isAuthenticated, async (req, res) => {
  try {
    const user = req.user as any;
    const { status } = req.body;

    if (user.role !== 'hr' && user.role !== 'admin' && user.role !== 'manager') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.update(applications)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(applications.id, parseInt(req.params.id)));

    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

export default router;
