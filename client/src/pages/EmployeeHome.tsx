import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function EmployeeHome() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold gradient-text mb-8">Employee Portal</h1>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Welcome to Employee Portal</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Clock in/out, manage requests, and access your employee pass.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
