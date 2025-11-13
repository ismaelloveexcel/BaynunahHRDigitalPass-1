import express from 'express';
import { db } from '../db/index.js';
import { applications, candidates, jobs, offers, agencies } from '../db/schema.js';
import { eq, and, gte, count, sql } from 'drizzle-orm';
import { isAdminOrHR } from '../middleware/auth.js';

const router = express.Router();

// Get recruitment metrics
router.get('/recruitment', isAdminOrHR, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Total applications
    const totalApplications = await db
      .select({ count: count() })
      .from(applications)
      .where(and(
        gte(applications.appliedAt, start),
        gte(end, applications.appliedAt)
      ));

    // Applications by status
    const applicationsByStatus = await db
      .select({
        status: applications.status,
        count: count(),
      })
      .from(applications)
      .where(and(
        gte(applications.appliedAt, start),
        gte(end, applications.appliedAt)
      ))
      .groupBy(applications.status);

    // Average match score
    const avgMatchScore = await db
      .select({
        avg: sql<number>`AVG(CAST(${applications.matchScore} AS DECIMAL))`,
      })
      .from(applications)
      .where(and(
        gte(applications.appliedAt, start),
        gte(end, applications.appliedAt)
      ));

    // Offers sent vs accepted
    const offersStats = await db
      .select({
        total: count(),
        accepted: sql<number>`COUNT(CASE WHEN ${offers.acceptedAt} IS NOT NULL THEN 1 END)`,
        rejected: sql<number>`COUNT(CASE WHEN ${offers.rejectedAt} IS NOT NULL THEN 1 END)`,
      })
      .from(offers)
      .where(and(
        gte(offers.createdAt, start),
        gte(end, offers.createdAt)
      ));

    // Top performing jobs (most applications)
    const topJobs = await db
      .select({
        jobId: applications.jobId,
        jobTitle: jobs.title,
        applicationCount: count(),
      })
      .from(applications)
      .leftJoin(jobs, eq(applications.jobId, jobs.id))
      .where(and(
        gte(applications.appliedAt, start),
        gte(end, applications.appliedAt)
      ))
      .groupBy(applications.jobId, jobs.title)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(5);

    // Agency performance
    const agencyStats = await db
      .select({
        agencyId: candidates.agencyId,
        candidateCount: count(),
      })
      .from(candidates)
      .where(sql`${candidates.agencyId} IS NOT NULL`)
      .groupBy(candidates.agencyId);

    // Applications per day (last 30 days)
    const applicationsPerDay = await db
      .select({
        date: sql<string>`DATE(${applications.appliedAt})`,
        count: count(),
      })
      .from(applications)
      .where(gte(applications.appliedAt, start))
      .groupBy(sql`DATE(${applications.appliedAt})`)
      .orderBy(sql`DATE(${applications.appliedAt})`);

    res.json({
      period: { start, end },
      summary: {
        totalApplications: totalApplications[0]?.count || 0,
        averageMatchScore: Math.round(avgMatchScore[0]?.avg || 0),
        offersTotal: offersStats[0]?.total || 0,
        offersAccepted: offersStats[0]?.accepted || 0,
        offersRejected: offersStats[0]?.rejected || 0,
        acceptanceRate: offersStats[0]?.total
          ? Math.round(((offersStats[0]?.accepted || 0) / offersStats[0]?.total) * 100)
          : 0,
      },
      applicationsByStatus,
      topJobs,
      agencyStats,
      applicationsPerDay,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get time-to-hire metrics
router.get('/time-to-hire', isAdminOrHR, async (req, res) => {
  try {
    // Calculate average time from application to offer acceptance
    const hiredApplications = await db
      .select({
        appliedAt: applications.appliedAt,
        acceptedAt: offers.acceptedAt,
      })
      .from(applications)
      .innerJoin(offers, eq(applications.id, offers.applicationId))
      .where(sql`${offers.acceptedAt} IS NOT NULL`);

    const timeToHireData = hiredApplications.map((app) => {
      const days = Math.round(
        (new Date(app.acceptedAt!).getTime() - new Date(app.appliedAt).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return days;
    });

    const averageTimeToHire =
      timeToHireData.length > 0
        ? Math.round(timeToHireData.reduce((a, b) => a + b, 0) / timeToHireData.length)
        : 0;

    res.json({
      averageTimeToHire,
      totalHires: timeToHireData.length,
      distribution: {
        under7Days: timeToHireData.filter((d) => d <= 7).length,
        under14Days: timeToHireData.filter((d) => d > 7 && d <= 14).length,
        under30Days: timeToHireData.filter((d) => d > 14 && d <= 30).length,
        over30Days: timeToHireData.filter((d) => d > 30).length,
      },
    });
  } catch (error) {
    console.error('Time-to-hire error:', error);
    res.status(500).json({ error: 'Failed to fetch time-to-hire data' });
  }
});

// Get funnel metrics
router.get('/funnel', isAdminOrHR, async (req, res) => {
  try {
    const funnelStages = [
      { stage: 'Applied', status: ['applied', 'cv_screened'] },
      { stage: 'Assessment', status: ['assessment_pending', 'assessment_completed'] },
      { stage: 'Shortlisted', status: ['shortlisted'] },
      { stage: 'Interview', status: ['interview_scheduled', 'interviewed'] },
      { stage: 'Offer', status: ['offer_pending', 'offer_sent', 'offer_accepted'] },
      { stage: 'Hired', status: ['hired'] },
    ];

    const funnelData = await Promise.all(
      funnelStages.map(async ({ stage, status }) => {
        const result = await db
          .select({ count: count() })
          .from(applications)
          .where(sql`${applications.status} IN (${sql.join(status.map(s => sql`${s}`), sql`, `)})`);

        return {
          stage,
          count: result[0]?.count || 0,
        };
      })
    );

    res.json({ funnel: funnelData });
  } catch (error) {
    console.error('Funnel error:', error);
    res.status(500).json({ error: 'Failed to fetch funnel data' });
  }
});

export default router;
