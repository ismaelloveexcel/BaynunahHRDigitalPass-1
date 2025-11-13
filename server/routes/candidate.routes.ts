import express from 'express';
import { db } from '../db/index.js';
import { candidates, applications, jobs, assessments, interviews, offers, onboardingChecklists, onboardingTasks } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { isAuthenticated, hasRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { parseCVFromPDF, calculateAIScore, matchCandidateToJob } from '../services/ai.service.js';
import { broadcast } from '../index.js';

const router = express.Router();

// Apply for a job (creates candidate profile if not exists)
router.post('/apply', isAuthenticated, upload.single('cv'), async (req, res) => {
  try {
    const user = req.user as any;
    const { jobId, coverLetter } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'CV file is required' });
    }

    // Parse CV
    const cvParsedData = await parseCVFromPDF(req.file.path);
    const aiScore = calculateAIScore(cvParsedData);

    // Check if candidate profile exists
    let candidate = await db.query.candidates.findFirst({
      where: eq(candidates.userId, user.id),
    });

    if (!candidate) {
      // Create candidate profile
      const passId = `BAY-CAN-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
      
      [candidate] = await db.insert(candidates).values({
        userId: user.id,
        passId,
        cvUrl: `/uploads/cvs/${req.file.filename}`,
        cvParsedData,
        aiScore: aiScore.toString(),
        skills: cvParsedData.skills,
        experience: cvParsedData.experience,
        education: cvParsedData.education,
      }).returning();
    }

    // Get job details
    const job = await db.query.jobs.findFirst({
      where: eq(jobs.id, parseInt(jobId)),
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if already applied
    const existingApplication = await db.query.applications.findFirst({
      where: and(
        eq(applications.candidateId, candidate.id),
        eq(applications.jobId, parseInt(jobId))
      ),
    });

    if (existingApplication) {
      return res.status(400).json({ error: 'Already applied to this job' });
    }

    // Match candidate to job
    const matchAnalysis = await matchCandidateToJob(cvParsedData, job.requirements);

    // Create application
    const [application] = await db.insert(applications).values({
      candidateId: candidate.id,
      jobId: parseInt(jobId),
      status: 'applied',
      matchScore: matchAnalysis.score.toString(),
      matchAnalysis,
      coverLetter,
    }).returning();

    // If job requires assessment, trigger it
    if (job.requiresAssessment) {
      // Auto-create assessment (questions would come from job config)
      await db.insert(assessments).values({
        applicationId: application.id,
        type: 'technical',
        questions: job.assessmentConfig || [],
      });
    }

    // Broadcast update to WebSocket clients
    broadcast({
      type: 'NEW_APPLICATION',
      data: { applicationId: application.id, jobId: job.id, candidatePass: candidate.passId },
    });

    res.status(201).json({
      application,
      passId: candidate.passId,
      matchScore: matchAnalysis.score,
    });
  } catch (error) {
    console.error('Application error:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// Get candidate pass details
router.get('/pass', isAuthenticated, hasRole('candidate'), async (req, res) => {
  try {
    const user = req.user as any;

    const candidate = await db.query.candidates.findFirst({
      where: eq(candidates.userId, user.id),
      with: {
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

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate profile not found' });
    }

    res.json({ candidate });
  } catch (error) {
    console.error('Get pass error:', error);
    res.status(500).json({ error: 'Failed to get pass details' });
  }
});

// Get application journey/timeline
router.get('/application/:id/journey', isAuthenticated, async (req, res) => {
  try {
    const user = req.user as any;
    const applicationId = parseInt(req.params.id);

    const application = await db.query.applications.findFirst({
      where: eq(applications.id, applicationId),
      with: {
        candidate: true,
        job: true,
        assessments: true,
        interviews: true,
        offer: true,
      },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Verify access
    if (application.candidate.userId !== user.id && user.role !== 'hr' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Build journey stages
    const journey = [
      {
        stage: 'Applied',
        status: 'completed',
        date: application.appliedAt,
        icon: 'check',
      },
      {
        stage: 'CV Screening',
        status: application.status === 'applied' ? 'in_progress' : 'completed',
        date: application.status !== 'applied' ? application.updatedAt : null,
        score: application.matchScore,
      },
      {
        stage: 'Assessment',
        status: application.assessments.length > 0
          ? application.assessments[0].completedAt ? 'completed' : 'in_progress'
          : 'pending',
        date: application.assessments[0]?.completedAt,
        score: application.assessments[0]?.score,
      },
      {
        stage: 'Interview',
        status: application.interviews.length > 0
          ? application.interviews[0].status === 'completed' ? 'completed' : 'scheduled'
          : 'pending',
        date: application.interviews[0]?.scheduledAt,
      },
      {
        stage: 'Offer',
        status: application.offer ? 'completed' : 'pending',
        date: application.offer?.createdAt,
      },
      {
        stage: 'Onboarding',
        status: application.status === 'onboarding' ? 'in_progress' : 
                application.status === 'hired' ? 'completed' : 'pending',
        date: null,
      },
    ];

    res.json({ journey, application });
  } catch (error) {
    console.error('Get journey error:', error);
    res.status(500).json({ error: 'Failed to get application journey' });
  }
});

// Submit assessment answers
router.post('/assessment/:id/submit', isAuthenticated, async (req, res) => {
  try {
    const user = req.user as any;
    const assessmentId = parseInt(req.params.id);
    const { answers } = req.body;

    const assessment = await db.query.assessments.findFirst({
      where: eq(assessments.id, assessmentId),
      with: {
        application: {
          with: {
            candidate: true,
          },
        },
      },
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Verify access
    if (assessment.application.candidate.userId !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Simple scoring (would use AI service in production)
    const score = Math.floor(60 + Math.random() * 40);

    // Update assessment
    await db.update(assessments)
      .set({
        answers,
        score: score.toString(),
        completedAt: new Date(),
      })
      .where(eq(assessments.id, assessmentId));

    // Update application status
    await db.update(applications)
      .set({
        status: 'assessment_completed',
        updatedAt: new Date(),
      })
      .where(eq(applications.id, assessment.applicationId));

    broadcast({
      type: 'ASSESSMENT_COMPLETED',
      data: { assessmentId, applicationId: assessment.applicationId, score },
    });

    res.json({ message: 'Assessment submitted successfully', score });
  } catch (error) {
    console.error('Submit assessment error:', error);
    res.status(500).json({ error: 'Failed to submit assessment' });
  }
});

// Accept/Reject offer
router.post('/offer/:id/:action', isAuthenticated, async (req, res) => {
  try {
    const user = req.user as any;
    const offerId = parseInt(req.params.id);
    const action = req.params.action; // accept or reject

    const offer = await db.query.offers.findFirst({
      where: eq(offers.id, offerId),
      with: {
        application: {
          with: {
            candidate: true,
          },
        },
      },
    });

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    // Verify access
    if (offer.application.candidate.userId !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (action === 'accept') {
      await db.update(offers)
        .set({ acceptedAt: new Date() })
        .where(eq(offers.id, offerId));

      await db.update(applications)
        .set({ status: 'offer_accepted', updatedAt: new Date() })
        .where(eq(applications.id, offer.applicationId));

      // Create onboarding checklist
      const [checklist] = await db.insert(onboardingChecklists).values({
        candidateId: offer.application.candidateId,
        jobId: offer.application.jobId,
        status: 'pending',
        startDate: offer.startDate,
      }).returning();

      // Add default onboarding tasks
      const defaultTasks = [
        { taskName: 'Upload Passport', category: 'documents', isRequired: true },
        { taskName: 'Upload Visa', category: 'documents', isRequired: true },
        { taskName: 'Upload Insurance Documents', category: 'documents', isRequired: true },
        { taskName: 'Bank Details', category: 'documents', isRequired: true },
        { taskName: 'Emergency Contact Information', category: 'personal', isRequired: true },
      ];

      for (const task of defaultTasks) {
        await db.insert(onboardingTasks).values({
          checklistId: checklist.id,
          ...task,
        });
      }

      broadcast({
        type: 'OFFER_ACCEPTED',
        data: { offerId, applicationId: offer.applicationId },
      });

      res.json({ message: 'Offer accepted successfully', checklistId: checklist.id });
    } else if (action === 'reject') {
      const { reason } = req.body;

      await db.update(offers)
        .set({ rejectedAt: new Date(), rejectionReason: reason })
        .where(eq(offers.id, offerId));

      await db.update(applications)
        .set({ status: 'offer_rejected', updatedAt: new Date() })
        .where(eq(applications.id, offer.applicationId));

      broadcast({
        type: 'OFFER_REJECTED',
        data: { offerId, applicationId: offer.applicationId },
      });

      res.json({ message: 'Offer rejected' });
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Offer action error:', error);
    res.status(500).json({ error: 'Failed to process offer action' });
  }
});

// Get onboarding checklist
router.get('/onboarding', isAuthenticated, hasRole('candidate'), async (req, res) => {
  try {
    const user = req.user as any;

    const candidate = await db.query.candidates.findFirst({
      where: eq(candidates.userId, user.id),
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const checklist = await db.query.onboardingChecklists.findFirst({
      where: eq(onboardingChecklists.candidateId, candidate.id),
      with: {
        tasks: true,
      },
    });

    res.json({ checklist });
  } catch (error) {
    console.error('Get onboarding error:', error);
    res.status(500).json({ error: 'Failed to get onboarding checklist' });
  }
});

// Upload onboarding document
router.post('/onboarding/task/:id/upload', isAuthenticated, upload.single('document'), async (req, res) => {
  try {
    const user = req.user as any;
    const taskId = parseInt(req.params.id);

    if (!req.file) {
      return res.status(400).json({ error: 'Document is required' });
    }

    const task = await db.query.onboardingTasks.findFirst({
      where: eq(onboardingTasks.id, taskId),
      with: {
        checklist: {
          with: {
            candidate: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Verify access
    if (task.checklist.candidate.userId !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update task
    await db.update(onboardingTasks)
      .set({
        documentUrl: `/uploads/documents/${req.file.filename}`,
        isCompleted: true,
        completedAt: new Date(),
        completedBy: user.id,
      })
      .where(eq(onboardingTasks.id, taskId));

    res.json({ message: 'Document uploaded successfully' });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

export default router;
