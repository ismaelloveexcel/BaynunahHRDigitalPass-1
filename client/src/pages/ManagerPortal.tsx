import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function ManagerPortal() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold gradient-text mb-8">Manager Portal</h1>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Welcome to Manager Portal</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Review candidates, schedule interviews, and manage your team.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
