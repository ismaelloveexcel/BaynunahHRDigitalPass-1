import express from 'express';
import { db } from '../db/index.js';
import { applications, offers, requests } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { isAdminOrHR } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Get all applications for HR dashboard
router.get('/applications', isAdminOrHR, async (req, res) => {
  try {
    const allApplications = await db.query.applications.findMany({
      with: {
        candidate: {
          with: {
            user: true,
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

// Send offer letter
router.post('/offer', isAdminOrHR, upload.single('offer'), async (req, res) => {
  try {
    const { applicationId, jobTitle, salary, benefits, startDate, expiryDate } = req.body;

    const [offer] = await db.insert(offers).values({
      applicationId: parseInt(applicationId),
      jobTitle,
      salary,
      benefits: benefits ? JSON.parse(benefits) : null,
      startDate: new Date(startDate),
      offerLetterUrl: req.file ? `/uploads/offers/${req.file.filename}` : '',
      expiryDate: new Date(expiryDate),
    }).returning();

    await db.update(applications)
      .set({ status: 'offer_sent', updatedAt: new Date() })
      .where(eq(applications.id, parseInt(applicationId)));

    res.status(201).json({ offer });
  } catch (error) {
    console.error('Send offer error:', error);
    res.status(500).json({ error: 'Failed to send offer' });
  }
});

// Review employee requests
router.get('/requests', isAdminOrHR, async (req, res) => {
  try {
    const allRequests = await db.query.requests.findMany({
      with: {
        employee: {
          with: {
            user: true,
          },
        },
      },
    });

    res.json({ requests: allRequests });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: 'Failed to get requests' });
  }
});

// Approve/reject request
router.post('/requests/:id/:action', isAdminOrHR, async (req, res) => {
  try {
    const user = req.user as any;
    const requestId = parseInt(req.params.id);
    const action = req.params.action; // approve or reject
    const { notes } = req.body;

    await db.update(requests)
      .set({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewedBy: user.id,
        reviewedAt: new Date(),
        reviewNotes: notes,
        updatedAt: new Date(),
      })
      .where(eq(requests.id, requestId));

    res.json({ message: `Request ${action}d successfully` });
  } catch (error) {
    console.error('Review request error:', error);
    res.status(500).json({ error: 'Failed to review request' });
  }
});

export default router;
