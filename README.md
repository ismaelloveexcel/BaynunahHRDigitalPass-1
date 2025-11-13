# Baynunah HRIS - Digital Pass System

A comprehensive HR Information System with AI-powered recruitment, digital pass tracking, and six integrated modules for complete workforce management.

## 🌟 System Overview

Baynunah HRIS is a unified backend system divided into **six modules**:

1. **Recruitment** - AI-powered candidate matching and assessment
2. **Onboarding** - Document tracking and verification
3. **Employee Management** - Attendance, profiles, and records
4. **Employee Requests** - Leave, expenses, and document requests
5. **Training & Development** - Learning programs and certifications
6. **Offboarding** - Exit procedures and clearance

## 🎯 Digital Pass System

### Pass Types

| Pass Type | Who Uses It | Purpose |
|-----------|-------------|---------|
| **Candidate Pass** (`BAY-XXX-###`) | All applicants | Track application stages, assessments, interviews, offers, onboarding |
| **Manager Pass** (`MGR-XXX`) | Hiring managers | View candidates, shortlist, schedule interviews, provide feedback |
| **Employee Pass** (`EMP-###`) | Active employees | Clock in/out, view requests, track onboarding, access services |
| **Agency Pass** (`AGY-###`) | External recruiters | Submit profiles, track submissions, view commissions |

## 👣 Candidate Journey

```
1. CV Upload → AI parses resume, scores it, recommends roles
2. Application → Pass ID created instantly (e.g., BAY-SWENG-014)
3. Assessment → Auto-triggered if required, AI-scored
4. Shortlisting → HR reviews, sends to Manager
5. Interview → Manager schedules, candidate picks slot
6. Feedback → Manager provides decision
7. Offer → PDF shown in pass, downloadable
8. Onboarding → Checklist embedded, document upload
```

## 🚀 Tech Stack

### Backend
- **Framework**: Express.js (v4.21.2)
- **Database**: PostgreSQL with Drizzle ORM (v0.39.1)
- **Authentication**: Passport.js with local strategy
- **Session**: express-session with PostgreSQL store
- **File Upload**: Multer (v2.0.2)
- **PDF Processing**: pdf-parse (v2.4.5)
- **AI Integration**: OpenAI SDK (v6.8.1) - optional
- **WebSockets**: ws (v8.18.0) for real-time updates

### Frontend
- **Framework**: React (v18.3.1)
- **Routing**: Wouter (v3.3.5)
- **UI**: Radix UI components with TailwindCSS (v3.4.17)
- **Forms**: React Hook Form (v7.55.0) with Zod validation
- **Build**: Vite (v5.4.20)
- **Styling**: TailwindCSS with glassmorphism effects

### Design System
- **Theme**: Configured via `config/theme.json`
- **Colors**: Baynunah blue (#002b5c) + Accent cyan (#33b3ed)
- **Typography**: Sora (headings) + Inter (body)
- **Effects**: Glass morphism with 20px blur, 22px radius

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Steps

1. **Clone the repository**
```bash
git clone https://github.com/ismaelloveexcel/BaynunahHRDigitalPass-1.git
cd BaynunahHRDigitalPass-1
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/baynunah_hris
SESSION_SECRET=your-random-secret-key
PORT=3000
NODE_ENV=development
OPENAI_API_KEY=your-openai-key-optional
```

4. **Set up the database**
```bash
# Generate migration files
npm run db:generate

# Run migrations
npm run db:migrate

# Optional: Open Drizzle Studio to view database
npm run db:studio
```

5. **Start development servers**

In separate terminals:

```bash
# Terminal 1: Start backend server
npm run server

# Terminal 2: Start frontend dev server
npm run dev
```

Access the application at `http://localhost:5173`

## 🏗️ Project Structure

```
baynunah-hris/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities
│   │   └── App.tsx        # Main app component
│   └── index.html
├── server/                # Express backend
│   ├── db/
│   │   ├── schema.ts      # Drizzle ORM schema
│   │   └── index.ts       # Database connection
│   ├── routes/            # API route handlers
│   │   ├── auth.routes.ts
│   │   ├── candidate.routes.ts
│   │   ├── job.routes.ts
│   │   ├── manager.routes.ts
│   │   ├── employee.routes.ts
│   │   ├── hr.routes.ts
│   │   ├── agency.routes.ts
│   │   └── pass.routes.ts
│   ├── middleware/        # Auth, upload, etc.
│   ├── services/          # AI service
│   └── index.ts           # Server entry point
├── config/                # JSON configuration
│   ├── theme.json         # Branding & colors
│   ├── routes.json        # Navigation config
│   ├── database.json      # Data structure
│   ├── passTemplate.json  # Pass definitions
│   └── ui.json            # UI components config
├── uploads/               # File uploads
├── drizzle/               # DB migrations
└── package.json
```

## 💡 Built-In AI Applications

### 1. CV Parsing & Job Matching
- Automatically extracts skills, experience, education from PDFs
- Calculates overall AI score (0-100)
- Matches candidates to job requirements
- Provides match analysis with strengths/weaknesses

### 2. Match Scoring
- Skills matching (60% weight)
- Experience matching (40% weight)
- Returns: strong_match, good_match, potential_match, weak_match

### 3. Assessment Evaluation
- AI scores technical assessments
- Evaluates cultural fit
- Provides detailed feedback and recommendations

### 4. Document Validation
- Validates uploaded documents during onboarding
- Checks format and completeness

## 🔐 Authentication & Authorization

### User Roles
- **Admin**: Full system access
- **HR**: Recruitment, employee management
- **Manager**: Team and candidate management
- **Employee**: Self-service portal
- **Candidate**: Application tracking
- **Agency**: Candidate submission

### Protected Routes
- Role-based access control
- Session-based authentication
- Passport.js local strategy

## 📡 API Endpoints

### Authentication
```
POST /api/auth/register      - Register new user
POST /api/auth/login         - Login
POST /api/auth/logout        - Logout
GET  /api/auth/me            - Get current user
POST /api/auth/change-password - Change password
```

### Candidates
```
POST /api/candidates/apply                   - Submit job application
GET  /api/candidates/pass                    - Get candidate pass
GET  /api/candidates/application/:id/journey - Get application timeline
POST /api/candidates/assessment/:id/submit   - Submit assessment
POST /api/candidates/offer/:id/:action       - Accept/reject offer
GET  /api/candidates/onboarding              - Get onboarding checklist
POST /api/candidates/onboarding/task/:id/upload - Upload document
```

### Jobs
```
GET  /api/jobs            - Get all active jobs
GET  /api/jobs/:id        - Get single job
POST /api/jobs            - Create job (HR only)
PUT  /api/jobs/:id        - Update job (HR only)
POST /api/jobs/:id/close  - Close job (HR only)
```

### Manager
```
GET  /api/manager/jobs                      - Get manager's jobs
POST /api/manager/shortlist/:applicationId  - Shortlist candidate
POST /api/manager/interview/schedule        - Schedule interview
POST /api/manager/interview/:id/feedback    - Submit feedback
POST /api/manager/finalize/:applicationId   - Approve/reject candidate
```

### Employee
```
GET  /api/employees/profile         - Get employee profile
POST /api/employees/attendance/clock - Clock in/out
POST /api/employees/requests        - Submit request
GET  /api/employees/requests        - Get my requests
```

### Pass System
```
GET /api/pass/:passId  - Get any pass by ID (public)
```

## 🎨 Theme Customization

Edit `config/theme.json`:

```json
{
  "theme": {
    "colors": {
      "primary": "#002b5c",
      "accent": "#33b3ed",
      "background": "#ffffff",
      "card": "rgba(255,255,255,0.55)",
      "cardBorder": "rgba(255,255,255,0.2)",
      "cardShadow": "rgba(51,179,237,0.35)"
    },
    "fonts": {
      "header": "Sora, sans-serif",
      "body": "Inter, sans-serif"
    },
    "effects": {
      "glass": {
        "blur": "20px",
        "radius": "22px"
      }
    }
  }
}
```

## 🚢 Deployment

### Prototype: Replit
1. Import GitHub repository
2. Set environment variables
3. Run `npm install && npm run db:migrate`
4. Start with `npm run dev` (frontend) and `npm run server` (backend)

### Production: Azure
1. **Frontend**: Azure Static Web Apps
2. **Backend**: Azure App Services
3. **Database**: Azure PostgreSQL
4. **Storage**: Azure Blob Storage (file uploads)

```bash
# Build for production
npm run build

# The dist/ folder contains production-ready files
```

## 🔄 Future Enhancements

- [ ] WhatsApp integration (Twilio/Meta API)
- [ ] AI Interview Assistant (speech-to-text)
- [ ] Document OCR (Tesseract.js)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Mobile app (React Native)

## 📄 License

Proprietary - Baynunah 2025

## 🤝 Support

For support and questions:
- Email: hr@baynunah.com
- Documentation: `/docs`

---

**Powered by HR |IS| Baynunah 2025**
