import { pgTable, text, serial, timestamp, integer, boolean, jsonb, decimal, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// ENUMS
// ============================================

export const userRoleEnum = pgEnum('user_role', ['admin', 'hr', 'manager', 'employee', 'candidate', 'agency']);
export const passTypeEnum = pgEnum('pass_type', ['candidate', 'manager', 'employee', 'agency']);
export const applicationStatusEnum = pgEnum('application_status', [
  'applied',
  'cv_screened',
  'assessment_pending',
  'assessment_completed',
  'shortlisted',
  'interview_scheduled',
  'interviewed',
  'offer_pending',
  'offer_sent',
  'offer_accepted',
  'offer_rejected',
  'onboarding',
  'hired',
  'rejected'
]);
export const assessmentTypeEnum = pgEnum('assessment_type', ['technical', 'cultural', 'cognitive', 'personality']);
export const interviewStatusEnum = pgEnum('interview_status', ['scheduled', 'completed', 'cancelled', 'rescheduled']);
export const onboardingStatusEnum = pgEnum('onboarding_status', ['pending', 'in_progress', 'completed', 'delayed']);
export const requestTypeEnum = pgEnum('request_type', ['leave', 'overtime', 'expense', 'document', 'equipment', 'other']);
export const requestStatusEnum = pgEnum('request_status', ['pending', 'approved', 'rejected', 'cancelled']);
export const trainingStatusEnum = pgEnum('training_status', ['scheduled', 'in_progress', 'completed', 'cancelled']);
export const offboardingStatusEnum = pgEnum('offboarding_status', ['initiated', 'in_progress', 'completed']);

// ============================================
// CORE TABLES
// ============================================

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone'),
  role: userRoleEnum('role').notNull().default('candidate'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const sessions = pgTable('sessions', {
  sid: text('sid').primaryKey(),
  sess: jsonb('sess').notNull(),
  expire: timestamp('expire').notNull(),
});

// ============================================
// MODULE 1: RECRUITMENT
// ============================================

export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  jobCode: text('job_code').notNull().unique(), // e.g., SWENG-001
  title: text('title').notNull(),
  department: text('department').notNull(),
  location: text('location').notNull(),
  description: text('description').notNull(),
  requirements: jsonb('requirements').notNull(), // Skills, experience, education
  salaryRange: jsonb('salary_range'), // { min, max, currency }
  jobDescriptionUrl: text('job_description_url'), // PDF link
  numberOfPositions: integer('number_of_positions').notNull().default(1),
  hiringManagerId: integer('hiring_manager_id').references(() => users.id),
  requiresAssessment: boolean('requires_assessment').notNull().default(false),
  assessmentConfig: jsonb('assessment_config'), // Assessment settings
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  closedAt: timestamp('closed_at'),
});

export const candidates = pgTable('candidates', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  passId: text('pass_id').notNull().unique(), // BAY-SWENG-014
  cvUrl: text('cv_url').notNull(),
  cvParsedData: jsonb('cv_parsed_data'), // AI parsed CV data
  aiScore: decimal('ai_score', { precision: 5, scale: 2 }), // Overall AI score
  skills: jsonb('skills'), // Extracted skills
  experience: jsonb('experience'), // Work experience
  education: jsonb('education'), // Education history
  source: text('source').notNull().default('direct'), // direct, agency, referral
  agencyId: integer('agency_id').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const applications = pgTable('applications', {
  id: serial('id').primaryKey(),
  candidateId: integer('candidate_id').references(() => candidates.id).notNull(),
  jobId: integer('job_id').references(() => jobs.id).notNull(),
  status: applicationStatusEnum('status').notNull().default('applied'),
  matchScore: decimal('match_score', { precision: 5, scale: 2 }), // AI matching score
  matchAnalysis: jsonb('match_analysis'), // Strengths, weaknesses, fit
  coverLetter: text('cover_letter'),
  appliedAt: timestamp('applied_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const assessments = pgTable('assessments', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id').references(() => applications.id).notNull(),
  type: assessmentTypeEnum('type').notNull(),
  questions: jsonb('questions').notNull(), // Array of questions
  answers: jsonb('answers'), // Candidate answers
  score: decimal('score', { precision: 5, scale: 2 }),
  aiEvaluation: jsonb('ai_evaluation'), // AI-generated evaluation
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const interviews = pgTable('interviews', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id').references(() => applications.id).notNull(),
  scheduledAt: timestamp('scheduled_at').notNull(),
  duration: integer('duration').notNull().default(60), // minutes
  interviewers: jsonb('interviewers').notNull(), // Array of interviewer IDs
  location: text('location'), // Physical or virtual link
  status: interviewStatusEnum('status').notNull().default('scheduled'),
  feedback: jsonb('feedback'), // Interviewer feedback
  rating: integer('rating'), // 1-5
  notes: text('notes'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const offers = pgTable('offers', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id').references(() => applications.id).notNull(),
  jobTitle: text('job_title').notNull(),
  salary: decimal('salary', { precision: 10, scale: 2 }).notNull(),
  benefits: jsonb('benefits'),
  startDate: timestamp('start_date').notNull(),
  offerLetterUrl: text('offer_letter_url').notNull(),
  expiryDate: timestamp('expiry_date').notNull(),
  acceptedAt: timestamp('accepted_at'),
  rejectedAt: timestamp('rejected_at'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const agencies = pgTable('agencies', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  passId: text('pass_id').notNull().unique(), // AGY-CODE
  companyName: text('company_name').notNull(),
  contactPerson: text('contact_person').notNull(),
  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }).notNull(), // Percentage
  totalCommission: decimal('total_commission', { precision: 10, scale: 2 }).default('0'),
  successfulHires: integer('successful_hires').default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============================================
// MODULE 2: ONBOARDING
// ============================================

export const onboardingChecklists = pgTable('onboarding_checklists', {
  id: serial('id').primaryKey(),
  candidateId: integer('candidate_id').references(() => candidates.id).notNull(),
  jobId: integer('job_id').references(() => jobs.id).notNull(),
  status: onboardingStatusEnum('status').notNull().default('pending'),
  startDate: timestamp('start_date').notNull(),
  expectedCompletionDate: timestamp('expected_completion_date'),
  actualCompletionDate: timestamp('actual_completion_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const onboardingTasks = pgTable('onboarding_tasks', {
  id: serial('id').primaryKey(),
  checklistId: integer('checklist_id').references(() => onboardingChecklists.id).notNull(),
  taskName: text('task_name').notNull(),
  description: text('description'),
  category: text('category').notNull(), // documents, equipment, training, etc.
  isRequired: boolean('is_required').notNull().default(true),
  documentUrl: text('document_url'), // Uploaded document
  aiValidation: jsonb('ai_validation'), // AI document validation result
  isCompleted: boolean('is_completed').notNull().default(false),
  completedAt: timestamp('completed_at'),
  completedBy: integer('completed_by').references(() => users.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============================================
// MODULE 3: EMPLOYEE MANAGEMENT
// ============================================

export const employees = pgTable('employees', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  passId: text('pass_id').notNull().unique(), // EMP-CODE
  employeeCode: text('employee_code').notNull().unique(),
  jobTitle: text('job_title').notNull(),
  department: text('department').notNull(),
  managerId: integer('manager_id').references(() => users.id),
  hireDate: timestamp('hire_date').notNull(),
  salary: decimal('salary', { precision: 10, scale: 2 }).notNull(),
  employmentType: text('employment_type').notNull(), // full-time, part-time, contract
  workLocation: text('work_location'),
  emergencyContact: jsonb('emergency_contact'),
  documents: jsonb('documents'), // Passport, visa, insurance, etc.
  isActive: boolean('is_active').notNull().default(true),
  terminationDate: timestamp('termination_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const attendance = pgTable('attendance', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').references(() => employees.id).notNull(),
  date: timestamp('date').notNull(),
  clockIn: timestamp('clock_in'),
  clockOut: timestamp('clock_out'),
  totalHours: decimal('total_hours', { precision: 5, scale: 2 }),
  breakDuration: integer('break_duration').default(0), // minutes
  status: text('status').notNull().default('present'), // present, absent, late, half-day
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============================================
// MODULE 4: EMPLOYEE REQUESTS
// ============================================

export const requests = pgTable('requests', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').references(() => employees.id).notNull(),
  type: requestTypeEnum('type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  amount: decimal('amount', { precision: 10, scale: 2 }),
  attachments: jsonb('attachments'), // Array of file URLs
  status: requestStatusEnum('status').notNull().default('pending'),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  reviewNotes: text('review_notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ============================================
// MODULE 5: TRAINING & DEVELOPMENT
// ============================================

export const trainingPrograms = pgTable('training_programs', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  duration: integer('duration'), // hours
  instructor: text('instructor'),
  maxParticipants: integer('max_participants'),
  cost: decimal('cost', { precision: 10, scale: 2 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const trainingEnrollments = pgTable('training_enrollments', {
  id: serial('id').primaryKey(),
  programId: integer('program_id').references(() => trainingPrograms.id).notNull(),
  employeeId: integer('employee_id').references(() => employees.id).notNull(),
  scheduledDate: timestamp('scheduled_date').notNull(),
  status: trainingStatusEnum('status').notNull().default('scheduled'),
  completionDate: timestamp('completion_date'),
  certificateUrl: text('certificate_url'),
  feedback: text('feedback'),
  rating: integer('rating'), // 1-5
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============================================
// MODULE 6: OFFBOARDING
// ============================================

export const offboardingProcesses = pgTable('offboarding_processes', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').references(() => employees.id).notNull(),
  initiatedBy: integer('initiated_by').references(() => users.id).notNull(),
  reason: text('reason').notNull(),
  lastWorkingDay: timestamp('last_working_day').notNull(),
  status: offboardingStatusEnum('status').notNull().default('initiated'),
  exitInterview: jsonb('exit_interview'),
  clearanceChecklist: jsonb('clearance_checklist'),
  finalSettlement: jsonb('final_settlement'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ============================================
// SUPPORTING TABLES
// ============================================

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(), // info, success, warning, error
  isRead: boolean('is_read').notNull().default(false),
  relatedEntity: text('related_entity'), // application, request, etc.
  relatedEntityId: integer('related_entity_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: integer('entity_id'),
  metadata: jsonb('metadata'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ many, one }) => ({
  candidates: many(candidates),
  employees: many(employees),
  managedJobs: many(jobs),
  notifications: many(notifications),
  activityLogs: many(activityLogs),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  hiringManager: one(users, {
    fields: [jobs.hiringManagerId],
    references: [users.id],
  }),
  applications: many(applications),
}));

export const candidatesRelations = relations(candidates, ({ one, many }) => ({
  user: one(users, {
    fields: [candidates.userId],
    references: [users.id],
  }),
  agency: one(users, {
    fields: [candidates.agencyId],
    references: [users.id],
  }),
  applications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  candidate: one(candidates, {
    fields: [applications.candidateId],
    references: [candidates.id],
  }),
  job: one(jobs, {
    fields: [applications.jobId],
    references: [jobs.id],
  }),
  assessments: many(assessments),
  interviews: many(interviews),
  offer: one(offers),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  user: one(users, {
    fields: [employees.userId],
    references: [users.id],
  }),
  manager: one(users, {
    fields: [employees.managerId],
    references: [users.id],
  }),
  attendance: many(attendance),
  requests: many(requests),
  trainingEnrollments: many(trainingEnrollments),
}));
