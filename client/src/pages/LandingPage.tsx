import { useLocation } from 'wouter';
import { Briefcase, Users, Building2, UserCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import uiConfig from '../../../config/ui.json';
import themeConfig from '../../../config/theme.json';

export default function LandingPage() {
  const [, setLocation] = useLocation();

  const cards = [
    {
      label: 'Applicants',
      icon: Briefcase,
      target: '/applicants',
      description: 'Upload CV, track your application journey',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Employees',
      icon: Users,
      target: '/employees',
      description: 'Clock in/out, manage requests, view pass',
      color: 'from-purple-500 to-pink-500',
    },
    {
      label: 'Managers',
      icon: Building2,
      target: '/managers',
      description: 'Review candidates, schedule interviews',
      color: 'from-orange-500 to-red-500',
    },
    {
      label: 'Agencies',
      icon: UserCheck,
      target: '/agencies',
      description: 'Submit candidates, track commissions',
      color: 'from-green-500 to-emerald-500',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Header */}
      <div className="text-center mb-16 animate-fade-in">
        <h1 className="text-6xl font-bold mb-4 gradient-text" style={{ fontFamily: themeConfig.theme.fonts.header }}>
          Baynunah HRIS
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto" style={{ fontFamily: themeConfig.theme.fonts.body }}>
          Digital Pass System - Transforming HR with AI-Powered Intelligence
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl w-full mb-16">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="glass-card p-8 cursor-pointer transform transition-all duration-300"
              onClick={() => setLocation(card.target)}
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-6 shadow-lg`}>
                <Icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: themeConfig.theme.fonts.header, color: themeConfig.theme.colors.primary }}>
                {card.label}
              </h3>
              <p className="text-gray-600" style={{ fontFamily: themeConfig.theme.fonts.body }}>
                {card.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Features Section */}
      <div className="glass-card p-12 max-w-6xl w-full mb-8">
        <h2 className="text-3xl font-bold mb-8 text-center" style={{ fontFamily: themeConfig.theme.fonts.header, color: themeConfig.theme.colors.primary }}>
          AI-Powered Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl font-bold">AI</span>
            </div>
            <h4 className="font-semibold mb-2" style={{ color: themeConfig.theme.colors.primary }}>CV Parsing & Scoring</h4>
            <p className="text-sm text-gray-600">Automatic CV analysis and job matching with AI-powered scoring</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl font-bold">🎯</span>
            </div>
            <h4 className="font-semibold mb-2" style={{ color: themeConfig.theme.colors.primary }}>Smart Assessment</h4>
            <p className="text-sm text-gray-600">AI-evaluated technical and cultural fit assessments</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl font-bold">📊</span>
            </div>
            <h4 className="font-semibold mb-2" style={{ color: themeConfig.theme.colors.primary }}>Digital Pass Tracking</h4>
            <p className="text-sm text-gray-600">Real-time journey tracking from application to onboarding</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-gray-600 mt-8" style={{ fontFamily: themeConfig.theme.fonts.body }}>
        <p>{uiConfig.landing.footerText}</p>
      </footer>
    </div>
  );
}
