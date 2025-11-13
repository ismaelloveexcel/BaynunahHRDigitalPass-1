import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText } from 'lucide-react';

export default function ApplicantHome() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold gradient-text mb-8">Applicant Portal</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card className="glass-card cursor-pointer" onClick={() => setLocation('/upload-cv')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-6 h-6" />
                Upload CV & Apply
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Upload your CV and let our AI match you with suitable positions</p>
            </CardContent>
          </Card>

          <Card className="glass-card cursor-pointer" onClick={() => setLocation('/login')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-6 h-6" />
                View My Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Track your application journey and digital pass</p>
            </CardContent>
          </Card>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-2xl font-bold mb-4">How It Works</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold shrink-0">1</div>
              <div>
                <h3 className="font-semibold">Upload Your CV</h3>
                <p className="text-sm text-gray-600">Our AI parses and scores your resume automatically</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold shrink-0">2</div>
              <div>
                <h3 className="font-semibold">Get Your Digital Pass</h3>
                <p className="text-sm text-gray-600">Receive a unique pass ID (e.g., BAY-SWENG-014) to track your journey</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold shrink-0">3</div>
              <div>
                <h3 className="font-semibold">Complete Assessments</h3>
                <p className="text-sm text-gray-600">Take AI-evaluated technical and cultural fit assessments</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold shrink-0">4</div>
              <div>
                <h3 className="font-semibold">Interview & Offer</h3>
                <p className="text-sm text-gray-600">Schedule interviews and receive offers through your pass</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
