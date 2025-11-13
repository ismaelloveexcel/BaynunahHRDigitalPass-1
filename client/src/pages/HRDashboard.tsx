import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, Users, Clock, CheckCircle, XCircle, Target } from 'lucide-react';

interface AnalyticsData {
  summary: {
    totalApplications: number;
    averageMatchScore: number;
    offersTotal: number;
    offersAccepted: number;
    offersRejected: number;
    acceptanceRate: number;
  };
  applicationsByStatus: Array<{ status: string; count: number }>;
  topJobs: Array<{ jobTitle: string; applicationCount: number }>;
  applicationsPerDay: Array<{ date: string; count: number }>;
}

interface TimeToHireData {
  averageTimeToHire: number;
  totalHires: number;
  distribution: {
    under7Days: number;
    under14Days: number;
    under30Days: number;
    over30Days: number;
  };
}

export default function HRDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeToHire, setTimeToHire] = useState<TimeToHireData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [analyticsRes, timeRes] = await Promise.all([
        fetch('/api/analytics/recruitment'),
        fetch('/api/analytics/time-to-hire'),
      ]);

      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data);
      }

      if (timeRes.ok) {
        const data = await timeRes.json();
        setTimeToHire(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  const getTrendColor = (value: number) => {
    if (value >= 70) return 'text-green-600';
    if (value >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold gradient-text mb-8">HR Analytics Dashboard</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics?.summary.totalApplications || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Match Score</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getTrendColor(analytics?.summary.averageMatchScore || 0)}`}>
                {analytics?.summary.averageMatchScore || 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">AI-powered matching</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Offer Acceptance</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getTrendColor(analytics?.summary.acceptanceRate || 0)}`}>
                {analytics?.summary.acceptanceRate || 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics?.summary.offersAccepted || 0} of {analytics?.summary.offersTotal || 0} offers
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Time to Hire</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{timeToHire?.averageTimeToHire || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">days</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Applications by Status */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Applications by Status</CardTitle>
              <CardDescription>Current pipeline distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.applicationsByStatus.map((item) => {
                  const total = analytics.summary.totalApplications || 1;
                  const percentage = Math.round((item.count / total) * 100);

                  return (
                    <div key={item.status}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium capitalize">
                          {item.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {item.count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-accent h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Jobs */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Top Performing Jobs</CardTitle>
              <CardDescription>Most applications received</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.topJobs.map((job, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <span className="font-medium">{job.jobTitle}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {job.applicationCount} applications
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time to Hire Distribution */}
        {timeToHire && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Time-to-Hire Distribution</CardTitle>
              <CardDescription>How quickly are we hiring?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {timeToHire.distribution.under7Days}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Under 7 days</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">
                    {timeToHire.distribution.under14Days}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">7-14 days</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-600">
                    {timeToHire.distribution.under30Days}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">14-30 days</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-3xl font-bold text-red-600">
                    {timeToHire.distribution.over30Days}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Over 30 days</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity Timeline */}
        <Card className="glass-card mt-6">
          <CardHeader>
            <CardTitle>Application Trend</CardTitle>
            <CardDescription>Daily application volume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end gap-2">
              {analytics?.applicationsPerDay.slice(-14).map((day, index) => {
                const maxCount = Math.max(...(analytics?.applicationsPerDay.map(d => d.count) || [1]));
                const height = (day.count / maxCount) * 100;

                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="text-xs text-gray-600">{day.count}</div>
                    <div
                      className="w-full bg-accent rounded-t transition-all hover:bg-primary"
                      style={{ height: `${height}%` }}
                      title={`${day.date}: ${day.count} applications`}
                    ></div>
                    <div className="text-xs text-gray-500 rotate-45 origin-top-left">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
