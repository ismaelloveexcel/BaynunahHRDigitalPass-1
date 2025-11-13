import express from 'express';
import { db } from '../db/index.js';
import { jobs } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { isAdminOrHR } from '../middleware/auth.js';

const router = express.Router();

// Get all active jobs (public)
router.get('/', async (req, res) => {
  try {
    const activeJobs = await db.query.jobs.findMany({
      where: eq(jobs.isActive, true),
      with: {
        hiringManager: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json({ jobs: activeJobs });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Failed to get jobs' });
  }
});

// Get single job
router.get('/:id', async (req, res) => {
  try {
    const job = await db.query.jobs.findFirst({
      where: eq(jobs.id, parseInt(req.params.id)),
      with: {
        hiringManager: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ job });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ error: 'Failed to get job' });
  }
});

// Create new job (HR/Admin only)
router.post('/', isAdminOrHR, async (req, res) => {
  try {
    const {
      title,
      department,
      location,
      description,
      requirements,
      salaryRange,
      numberOfPositions,
      hiringManagerId,
      requiresAssessment,
      assessmentConfig,
    } = req.body;

    // Generate job code
    const prefix = title.substring(0, 3).toUpperCase();
    const count = await db.$count(jobs);
    const jobCode = `${prefix}-${String(count + 1).padStart(3, '0')}`;

    const [newJob] = await db.insert(jobs).values({
      jobCode,
      title,
      department,
      location,
      description,
      requirements,
      salaryRange,
      numberOfPositions: numberOfPositions || 1,
      hiringManagerId: hiringManagerId || null,
      requiresAssessment: requiresAssessment || false,
      assessmentConfig: assessmentConfig || null,
    }).returning();

    res.status(201).json({ job: newJob });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// Update job
router.put('/:id', isAdminOrHR, async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    const updates = req.body;

    const [updated Job] = await db.update(jobs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(jobs.id, jobId))
      .returning();

    res.json({ job: updatedJob });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// Close job
router.post('/:id/close', isAdminOrHR, async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);

    await db.update(jobs)
      .set({ isActive: false, closedAt: new Date() })
      .where(eq(jobs.id, jobId));

    res.json({ message: 'Job closed successfully' });
  } catch (error) {
    console.error('Close job error:', error);
    res.status(500).json({ error: 'Failed to close job' });
  }
});

export default router;
