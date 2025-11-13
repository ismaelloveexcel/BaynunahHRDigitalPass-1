import express from 'express';
import { db } from '../db/index.js';
import { jobs, applications, interviews, offers } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { isManager } from '../middleware/auth.js';
import { broadcast } from '../index.js';

const router = express.Router();

// Get manager's jobs
router.get('/jobs', isManager, async (req, res) => {
  try {
    const user = req.user as any;

    const managerJobs = await db.query.jobs.findMany({
      where: eq(jobs.hiringManagerId, user.id),
      with: {
        applications: {
          with: {
            candidate: {
              with: {
                user: true,
              },
            },
            assessments: true,
            interviews: true,
          },
        },
      },
    });

    res.json({ jobs: managerJobs });
  } catch (error) {
    console.error('Get manager jobs error:', error);
    res.status(500).json({ error: 'Failed to get jobs' });
  }
});

// Shortlist candidate
router.post('/shortlist/:applicationId', isManager, async (req, res) => {
  try {
    await db.update(applications)
      .set({ status: 'shortlisted', updatedAt: new Date() })
      .where(eq(applications.id, parseInt(req.params.applicationId)));

    broadcast({
      type: 'CANDIDATE_SHORTLISTED',
      data: { applicationId: parseInt(req.params.applicationId) },
    });

    res.json({ message: 'Candidate shortlisted' });
  } catch (error) {
    console.error('Shortlist error:', error);
    res.status(500).json({ error: 'Failed to shortlist candidate' });
  }
});

// Schedule interview
router.post('/interview/schedule', isManager, async (req, res) => {
  try {
    const { applicationId, scheduledAt, duration, location, interviewers } = req.body;

    const [interview] = await db.insert(interviews).values({
      applicationId,
      scheduledAt: new Date(scheduledAt),
      duration: duration || 60,
      location,
      interviewers,
      status: 'scheduled',
    }).returning();

    await db.update(applications)
      .set({ status: 'interview_scheduled', updatedAt: new Date() })
      .where(eq(applications.id, applicationId));

    broadcast({
      type: 'INTERVIEW_SCHEDULED',
      data: { interviewId: interview.id, applicationId },
    });

    res.status(201).json({ interview });
  } catch (error) {
    console.error('Schedule interview error:', error);
    res.status(500).json({ error: 'Failed to schedule interview' });
  }
});

// Submit interview feedback
router.post('/interview/:id/feedback', isManager, async (req, res) => {
  try {
    const { feedback, rating, notes } = req.body;

    await db.update(interviews)
      .set({
        feedback,
        rating,
        notes,
        status: 'completed',
        completedAt: new Date(),
      })
      .where(eq(interviews.id, parseInt(req.params.id)));

    res.json({ message: 'Feedback submitted' });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Finalize candidate (approve hire)
router.post('/finalize/:applicationId', isManager, async (req, res) => {
  try {
    const { decision, notes } = req.body; // decision: 'approve', 'reject', 'review'

    if (decision === 'approve') {
      await db.update(applications)
        .set({ status: 'offer_pending', updatedAt: new Date() })
        .where(eq(applications.id, parseInt(req.params.applicationId)));

      broadcast({
        type: 'CANDIDATE_APPROVED',
        data: { applicationId: parseInt(req.params.applicationId) },
      });
    } else if (decision === 'reject') {
      await db.update(applications)
        .set({ status: 'rejected', updatedAt: new Date() })
        .where(eq(applications.id, parseInt(req.params.applicationId)));

      broadcast({
        type: 'CANDIDATE_REJECTED',
        data: { applicationId: parseInt(req.params.applicationId) },
      });
    }

    res.json({ message: `Candidate ${decision}d successfully` });
  } catch (error) {
    console.error('Finalize error:', error);
    res.status(500).json({ error: 'Failed to finalize decision' });
  }
});

export default router;
