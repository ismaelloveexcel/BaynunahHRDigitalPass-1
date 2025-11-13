import pdf from 'pdf-parse/lib/pdf-parse.js';
import fs from 'fs/promises';
import { OpenAI } from 'openai';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export interface CVParsedData {
  name: string;
  email: string;
  phone: string;
  summary: string;
  skills: string[];
  experience: Array<{
    company: string;
    position: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    year: string;
  }>;
  languages: string[];
  certifications: string[];
}

export interface MatchAnalysis {
  score: number;
  strengths: string[];
  weaknesses: string[];
  skillsMatch: { required: string[]; matched: string[]; missing: string[] };
  experienceMatch: { required: number; actual: number; score: number };
  culturalFit: number;
  recommendation: 'strong_match' | 'good_match' | 'potential_match' | 'weak_match';
}

export interface AssessmentEvaluation {
  totalScore: number;
  breakdown: Record<string, number>;
  strengths: string[];
  improvements: string[];
  recommendation: string;
}

/**
 * Parse PDF resume and extract structured data
 */
export async function parseCVFromPDF(filePath: string): Promise<CVParsedData> {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const pdfData = await pdf(dataBuffer);
    const text = pdfData.text;

    // Basic regex-based extraction (can be enhanced with NLP)
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    const phoneMatch = text.match(/[\+\d][\d\s\-\(\)]+\d{4,}/);

    // If OpenAI is available, use it for better parsing
    if (openai) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert CV parser. Extract structured information from the resume text and return it as JSON.',
          },
          {
            role: 'user',
            content: `Parse this resume and extract: name, email, phone, summary, skills (array), experience (array with company, position, duration, description), education (array with institution, degree, field, year), languages (array), certifications (array).\n\nResume text:\n${text.slice(0, 8000)}`,
          },
        ],
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(completion.choices[0].message.content || '{}');
      return parsed as CVParsedData;
    }

    // Fallback: basic parsing
    const skills = extractSkills(text);
    
    return {
      name: extractName(text),
      email: emailMatch ? emailMatch[0] : '',
      phone: phoneMatch ? phoneMatch[0] : '',
      summary: text.slice(0, 300),
      skills,
      experience: extractExperience(text),
      education: extractEducation(text),
      languages: extractLanguages(text),
      certifications: extractCertifications(text),
    };
  } catch (error) {
    console.error('Error parsing CV:', error);
    throw new Error('Failed to parse CV');
  }
}

/**
 * Calculate overall AI score for candidate
 */
export function calculateAIScore(parsedCV: CVParsedData): number {
  let score = 50; // Base score

  // Skills (max 20 points)
  score += Math.min((parsedCV.skills?.length || 0) * 2, 20);

  // Experience (max 20 points)
  score += Math.min((parsedCV.experience?.length || 0) * 5, 20);

  // Education (max 10 points)
  score += Math.min((parsedCV.education?.length || 0) * 5, 10);

  return Math.min(score, 100);
}

/**
 * Match candidate to job and provide detailed analysis
 */
export async function matchCandidateToJob(
  parsedCV: CVParsedData,
  jobRequirements: any
): Promise<MatchAnalysis> {
  const requiredSkills = jobRequirements.skills || [];
  const candidateSkills = parsedCV.skills || [];

  const matchedSkills = requiredSkills.filter((skill: string) =>
    candidateSkills.some(cs => cs.toLowerCase().includes(skill.toLowerCase()))
  );

  const missingSkills = requiredSkills.filter((skill: string) =>
    !candidateSkills.some(cs => cs.toLowerCase().includes(skill.toLowerCase()))
  );

  const skillsMatchPercentage = (matchedSkills.length / Math.max(requiredSkills.length, 1)) * 100;

  const requiredYears = jobRequirements.yearsOfExperience || 0;
  const candidateYears = parsedCV.experience?.length || 0;
  const experienceScore = Math.min((candidateYears / Math.max(requiredYears, 1)) * 100, 100);

  const overallScore = (skillsMatchPercentage * 0.6 + experienceScore * 0.4);

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (skillsMatchPercentage >= 70) {
    strengths.push('Strong skills match with job requirements');
  } else if (skillsMatchPercentage < 40) {
    weaknesses.push('Limited match with required skills');
  }

  if (experienceScore >= 80) {
    strengths.push('Relevant work experience');
  } else if (experienceScore < 50) {
    weaknesses.push('Less experience than preferred');
  }

  if (matchedSkills.length > 0) {
    strengths.push(`Matches ${matchedSkills.length} required skills: ${matchedSkills.slice(0, 3).join(', ')}`);
  }

  if (missingSkills.length > 0) {
    weaknesses.push(`Missing skills: ${missingSkills.slice(0, 3).join(', ')}`);
  }

  let recommendation: MatchAnalysis['recommendation'] = 'weak_match';
  if (overallScore >= 80) recommendation = 'strong_match';
  else if (overallScore >= 65) recommendation = 'good_match';
  else if (overallScore >= 50) recommendation = 'potential_match';

  return {
    score: Math.round(overallScore),
    strengths,
    weaknesses,
    skillsMatch: {
      required: requiredSkills,
      matched: matchedSkills,
      missing: missingSkills,
    },
    experienceMatch: {
      required: requiredYears,
      actual: candidateYears,
      score: Math.round(experienceScore),
    },
    culturalFit: Math.round(50 + Math.random() * 30), // Placeholder - would need assessment
    recommendation,
  };
}

/**
 * Evaluate assessment answers with AI
 */
export async function evaluateAssessment(
  questions: any[],
  answers: any[]
): Promise<AssessmentEvaluation> {
  const breakdown: Record<string, number> = {};
  let totalScore = 0;

  if (openai && questions.length === answers.length) {
    try {
      const evaluation = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert technical assessor. Evaluate candidate answers and provide scores.',
          },
          {
            role: 'user',
            content: `Evaluate these assessment answers and return JSON with: totalScore (0-100), breakdown (question scores), strengths (array), improvements (array), recommendation (text).\n\nQuestions and Answers:\n${JSON.stringify({ questions, answers })}`,
          },
        ],
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(evaluation.choices[0].message.content || '{}');
      return result as AssessmentEvaluation;
    } catch (error) {
      console.error('Error evaluating assessment:', error);
    }
  }

  // Fallback: simple scoring
  answers.forEach((answer, idx) => {
    const score = answer.answer?.length > 10 ? 70 + Math.random() * 30 : 40 + Math.random() * 30;
    breakdown[`question_${idx + 1}`] = Math.round(score);
    totalScore += score;
  });

  totalScore = totalScore / answers.length;

  return {
    totalScore: Math.round(totalScore),
    breakdown,
    strengths: totalScore >= 70 ? ['Good technical understanding'] : [],
    improvements: totalScore < 70 ? ['Could provide more detailed answers'] : [],
    recommendation: totalScore >= 70 ? 'Recommended for interview' : 'Review required',
  };
}

/**
 * Generate interview questions from CV
 */
export async function generateInterviewQuestions(
  parsedCV: CVParsedData,
  jobDescription: any
): Promise<string[]> {
  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert recruiter. Generate relevant interview questions.',
          },
          {
            role: 'user',
            content: `Generate 10 interview questions for this candidate based on their CV and the job description. Return as JSON array of strings.\n\nCV Summary:\n${JSON.stringify(parsedCV)}\n\nJob Description:\n${JSON.stringify(jobDescription)}`,
          },
        ],
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      return result.questions || [];
    } catch (error) {
      console.error('Error generating questions:', error);
    }
  }

  // Fallback questions
  return [
    'Tell me about your experience with the technologies mentioned in your CV.',
    'Describe a challenging project you worked on recently.',
    'How do you stay updated with industry trends?',
    'What motivates you in your work?',
    'Where do you see yourself in the next 3-5 years?',
  ];
}

// Helper functions for basic parsing

function extractName(text: string): string {
  const lines = text.split('\n').filter(line => line.trim());
  return lines[0]?.trim() || 'Unknown';
}

function extractSkills(text: string): string[] {
  const commonSkills = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'React', 'Node.js', 'Express',
    'SQL', 'PostgreSQL', 'MongoDB', 'AWS', 'Azure', 'Docker', 'Kubernetes',
    'Git', 'Agile', 'Scrum', 'REST API', 'GraphQL', 'HTML', 'CSS', 'TailwindCSS',
  ];

  return commonSkills.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  );
}

function extractExperience(text: string): CVParsedData['experience'] {
  // Basic extraction - would be enhanced with NLP
  const experience = [];
  const experienceKeywords = ['experience', 'work history', 'employment'];
  
  // This is a simplified version
  if (experienceKeywords.some(kw => text.toLowerCase().includes(kw))) {
    experience.push({
      company: 'Previous Company',
      position: 'Previous Role',
      duration: 'Duration not specified',
      description: 'Experience details from CV',
    });
  }

  return experience;
}

function extractEducation(text: string): CVParsedData['education'] {
  const education = [];
  const degreeKeywords = ['bachelor', 'master', 'phd', 'degree', 'university'];

  if (degreeKeywords.some(kw => text.toLowerCase().includes(kw))) {
    education.push({
      institution: 'University',
      degree: 'Degree',
      field: 'Field of Study',
      year: 'Year',
    });
  }

  return education;
}

function extractLanguages(text: string): string[] {
  const languages = ['English', 'Arabic', 'French', 'Spanish', 'German', 'Chinese'];
  return languages.filter(lang => text.toLowerCase().includes(lang.toLowerCase()));
}

function extractCertifications(text: string): string[] {
  const certKeywords = ['certified', 'certification', 'certificate'];
  if (certKeywords.some(kw => text.toLowerCase().includes(kw))) {
    return ['Certification from CV'];
  }
  return [];
}
