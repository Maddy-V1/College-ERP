# College ERP System

> **A modern, mobile-first, role-based academic management system built for educational institutions**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61dafb.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e.svg)](https://supabase.com/)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Features by Portal](#-features-by-portal)
- [All Pages Overview](#-all-pages-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Development](#-development)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Design System](#-design-system)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## 🎯 Overview

College ERP is a comprehensive academic management system designed with a **role-based architecture** that separates concerns across three specialized portals:

### Core Philosophy
```
Admin creates structure → Professor operates within structure → Student consumes information
```

### Three Portals, One System

| Portal | Target Device | Primary Users | Purpose |
|--------|--------------|---------------|---------|
| **Admin Portal** | Desktop | Administrators, HODs | Structure creation & management |
| **Professor Portal** | Mobile-first | Faculty members | Daily operations & teaching |
| **Student Portal** | Mobile-first | Students | Academic information consumption |

### Key Principles

1. **No Data Duplication** - Everything is linked, not copied
2. **Role-Based Access Control** - Strict separation of concerns
3. **Mobile-First for Operations** - Professors and students use phones
4. **Desktop for Administration** - Complex management needs space
5. **Single Source of Truth** - One unified database

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
├───────────────┬──────────────────┬──────────────────────────┤
│ Admin Portal  │ Professor Portal │ Student Portal           │
│ (Port 5173)   │ (Port 5174)      │ (Port 5175)             │
│ Desktop-first │ Mobile-first     │ Mobile-first            │
└───────┬───────┴────────┬─────────┴──────────┬──────────────┘
        │                │                    │
        │                │                    │
┌───────▼────────────────▼────────────────────▼──────────────┐
│                   API GATEWAY LAYER                         │
├──────────────────────────┬──────────────────────────────────┤
│   Admin Backend API      │   Academic Backend API           │
│   (Port 4001)            │   (Port 4002)                    │
│   High Privilege Ops     │   Professor + Student Ops        │
└──────────┬───────────────┴────────────┬─────────────────────┘
           │                            │
           │                            │
┌──────────▼────────────────────────────▼─────────────────────┐
│                    SUPABASE LAYER                            │
├──────────────────────────────────────────────────────────────┤
│  Auth Service  │  PostgreSQL DB  │  Storage (Files)          │
└──────────────────────────────────────────────────────────────┘
```

### Academic Hierarchy

```
Institution
    │
    └── BATCHES (2023-2027, 2024-2028)
            │
            ├── Linked COURSES (B.Tech, MBA, M.Tech)
            │       │
            │       └── BRANCHES (CSE, IT, ECE, Mechanical)
            │               │
            │               └── CLASSES (2024-CSE-A, 2024-CSE-B)
            │                       │
            │                       ├── Students (50-60 per class)
            │                       ├── Subjects (per semester)
            │                       ├── Professors (per subject)
            │                       ├── Timetable
            │                       ├── CR (Class Representative)
            │                       └── Class In-charge
```

**Critical Understanding**: The **CLASS** is the operational unit where everything converges.

---

## ✨ Features by Portal

### 🔐 Admin Portal (Desktop-Optimized)

**User Management**
- Create and manage professor accounts
- Register and manage student accounts
- Default password generation: `Prof@{employee_id}` or `Student@{roll_number}`
- Custom password support during creation
- Role-based access control

**Academic Structure Management**
- Create and manage batches (academic years)
- Link courses to batches
- Create branches under courses
- Generate classes with auto-suggested labels
- Assign students to classes
- Link professors to subjects

**Operational Setup**
- Upload or create structured timetables
- Designate Class Representatives (CRs)
- Assign Class In-charges
- Auto-generate subject-based communication groups
- Global directory search

**Reporting & Analytics**
- View attendance reports
- Track academic performance
- Monitor system usage
- Export data to Excel

---

### 👨‍🏫 Professor Portal (Mobile-First)

**Daily Operations**
- **MS Teams-style timetable view** - Today's classes in vertical timeline
- **Attendance management** - 10-student pagination UI for quick marking
- **Marks/grades upload** - Subject-wise assessment management
- **Real-time updates** - Instant sync across all portals

**Communication**
- Direct CR communication channel
- Subject-based group messaging
- Announcement broadcasting
- Real-time notifications

**Class Management**
- View assigned classes and subjects
- Track total classes conducted
- Edit past attendance sessions
- Manage assessment components

**Profile & Settings**
- View teaching schedule
- Update personal information
- Leave management
- Notification preferences

---

### 🎓 Student Portal (Mobile-First)

**Academic Information**
- **Personal timetable view** - Daily class schedule with room numbers
- **Attendance tracking** - Subject-wise attendance percentage
- **Marks/results view** - Assessment-wise performance tracking
- **Real-time notifications** - Instant updates on marks and attendance

**Communication**
- Subject group participation
- Receive announcements
- View notifications
- CR communication channel

**Personal Dashboard**
- Overall attendance percentage
- Academic performance overview
- Fee payment status
- Profile management

---

## 📄 All Pages Overview

### Admin Portal Pages (20 Pages)

| Page | Route | Description |
|------|-------|-------------|
| **Dashboard** | `/` | Overview statistics, quick actions, recent activity |
| **DashboardPage** | `/dashboard` | Detailed analytics and reports |
| **Batches** | `/batches` | List all batches, create new batch |
| **BatchDetail** | `/batches/:id` | Accordion UI - Link courses, add branches, create classes |
| **Courses** | `/courses` | Manage all courses (B.Tech, MBA, etc.) |
| **CourseDetail** | `/courses/:id` | Course details and linked batches |
| **CourseBatches** | `/course-batches` | View course-batch relationships |
| **CourseBranches** | `/course-branches` | Manage branches under courses |
| **CourseBatchBranches** | `/course-batch-branches` | Complex relationship management |
| **ClassesPage** | `/classes` | List all classes across batches |
| **ClassManagement** | `/classes/:id` | 5 tabs: Students, Subjects, Timetable, CR, In-charge |
| **Sections** | `/sections` | Manage section labels (A, B, C) |
| **Professors** | `/professors` | List all professors |
| **ProfessorsPage** | `/professors-management` | Detailed professor management |
| **Students** | `/students` | List all students |
| **StudentsPage** | `/students-management` | Detailed student management |
| **Subjects** | `/subjects` | Manage all subjects |
| **Timetables** | `/timetables` | View and manage all timetables |
| **Notifications** | `/notifications` | System notifications |
| **LoginPage** | `/login` | Admin authentication |

### Professor Portal Pages (6 Pages)

| Page | Route | Description |
|------|-------|-------------|
| **Home** | `/` | Today's timetable (MS Teams style), quick actions |
| **Attendance** | `/attendance` | Take attendance with 10-student pagination |
| **Marks** | `/marks` | Upload and manage student marks |
| **Groups** | `/groups` | Subject-based communication groups |
| **Profile** | `/profile` | Personal information, leave management |
| **LoginPage** | `/login` | Professor authentication |

### Student Portal Pages (7 Pages)

| Page | Route | Description |
|------|-------|-------------|
| **Home** | `/` | Personal timetable, today's classes |
| **Attendance** | `/attendance` | Subject-wise attendance percentage |
| **Marks** | `/marks` | View marks and assessment results |
| **Groups** | `/groups` | Participate in subject groups |
| **Notifications** | `/notifications` | View all notifications |
| **Profile** | `/profile` | Personal information, fee status |
| **LoginPage** | `/login` | Student authentication |

---

## 🛠️ Tech Stack

### Frontend (All Portals)

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2 | UI library |
| **TypeScript** | 5.4 | Type safety |
| **Vite** | 5.1 | Build tool & dev server |
| **React Router** | 6.22 | Client-side routing |
| **Tailwind CSS** | 3.4 | Utility-first styling |
| **Lucide React** | 0.356 | Icon library |
| **Zustand** | 4.5 | State management |
| **TanStack Query** | 5.28 | Server state management |
| **Supabase JS** | 2.42 | Database client |

### Backend (Both APIs)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | Runtime environment |
| **Express** | 4.18 | Web framework |
| **TypeScript** | 5.4 | Type safety |
| **Supabase** | 2.42 | Database & auth |
| **Zod** | 3.22 | Schema validation |
| **Helmet** | 7.1 | Security headers |
| **CORS** | 2.8 | Cross-origin support |
| **Morgan** | 1.10 | HTTP logging |
| **tsx** | 4.7+ | TypeScript execution |

### Database & Infrastructure

| Service | Purpose |
|---------|---------|
| **Supabase** | PostgreSQL database, authentication, storage |
| **PostgreSQL** | Relational database (via Supabase) |
| **Supabase Auth** | User authentication & authorization |
| **Supabase Storage** | File storage (timetables, documents) |
| **Supabase Realtime** | Live data synchronization |

---

## 📁 Project Structure

```
college-erp/
├── 📄 package.json              # Root workspace configuration
├── 📄 tsconfig.base.json        # Shared TypeScript config
├── 📄 .eslintrc.cjs             # ESLint configuration
├── 📄 .prettierrc               # Code formatting rules
├── 📄 .gitignore                # Git ignore patterns
│
├── 📁 docs/                     # Comprehensive documentation
│   ├── erp_readme.md            # Project overview
│   ├── architecture_doc.md      # System architecture
│   ├── database_schema_doc.md   # Database structure
│   ├── design_system_doc.md     # UI/UX guidelines
│   ├── user_flows_doc.md        # User journey documentation
│   ├── cursor_prompts_doc.md    # AI development prompts
│   └── quick_start_guide.md     # Quick setup guide
│
├── 📁 admin-portal/             # Admin Portal (React + Vite)
│   ├── src/
│   │   ├── App.tsx              # Router setup
│   │   ├── main.tsx             # Entry point
│   │   ├── index.css            # Global styles
│   │   ├── contexts/            # React contexts (Auth)
│   │   ├── components/          # Reusable components
│   │   │   └── layout/          # Sidebar, Header, Layout
│   │   └── pages/               # 20 page components
│   │       ├── Dashboard.tsx
│   │       ├── Batches.tsx
│   │       ├── BatchDetail.tsx
│   │       ├── ClassManagement.tsx
│   │       ├── Professors.tsx
│   │       ├── Students.tsx
│   │       └── ...
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── 📁 professor-portal/         # Professor Portal (React + Vite)
│   ├── src/
│   │   ├── App.tsx              # Mobile-first with bottom nav
│   │   ├── components/
│   │   │   └── Layout.tsx       # Bottom navigation
│   │   └── pages/               # 6 page components
│   │       ├── Home.tsx         # Timetable view
│   │       ├── Attendance.tsx   # Attendance marking
│   │       ├── Marks.tsx        # Marks upload
│   │       ├── Groups.tsx       # Communication
│   │       └── Profile.tsx
│   └── package.json
│
├── 📁 student-portal/           # Student Portal (React + Vite)
│   ├── src/
│   │   ├── App.tsx              # Mobile-first with bottom nav
│   │   └── pages/               # 7 page components
│   │       ├── Home.tsx         # Personal timetable
│   │       ├── Attendance.tsx   # Attendance view
│   │       ├── Marks.tsx        # Marks view
│   │       ├── Groups.tsx       # Group participation
│   │       ├── Notifications.tsx
│   │       └── Profile.tsx
│   └── package.json
│
├── 📁 admin-backend/            # Admin API (Express + TypeScript)
│   ├── src/
│   │   ├── index.ts             # Server entry point
│   │   ├── routes/              # API routes
│   │   │   ├── auth.ts          # Authentication
│   │   │   ├── professors.ts    # Professor management
│   │   │   ├── students.ts      # Student management
│   │   │   ├── batches.ts       # Batch management
│   │   │   ├── courses.ts       # Course management
│   │   │   ├── classes.ts       # Class management
│   │   │   └── timetables.ts    # Timetable management
│   │   ├── middleware/          # Express middleware
│   │   │   ├── errorHandler.ts
│   │   │   └── notFoundHandler.ts
│   │   └── lib/
│   │       └── supabase.ts      # Supabase client
│   └── package.json
│
├── 📁 academic-backend/         # Academic API (Express + TypeScript)
│   ├── src/
│   │   ├── index.ts             # Server entry point
│   │   ├── routes/              # API routes
│   │   │   ├── timetable.ts     # Timetable queries
│   │   │   ├── attendance.ts    # Attendance operations
│   │   │   ├── marks.ts         # Marks management
│   │   │   ├── groups.ts        # Communication groups
│   │   │   └── notifications.ts # Notification system
│   │   ├── middleware/
│   │   └── lib/
│   │       └── supabase.ts
│   └── package.json
│
├── 📁 shared/                   # Shared packages
│   ├── types/                   # @college-erp/types
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── common.ts        # Common types
│   │   │   ├── auth.ts          # Auth types
│   │   │   ├── user.ts          # User types
│   │   │   ├── academic.ts      # Academic types
│   │   │   ├── attendance.ts    # Attendance types
│   │   │   ├── marks.ts         # Marks types
│   │   │   └── timetable.ts     # Timetable types
│   │   └── package.json
│   │
│   ├── utils/                   # @college-erp/utils
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── date.ts          # Date utilities
│   │   │   ├── format.ts        # Formatting utilities
│   │   │   ├── validation.ts    # Validation helpers
│   │   │   └── constants.ts     # App constants
│   │   └── package.json
│   │
│   └── components/              # @college-erp/components
│       ├── src/
│       │   ├── buttons/         # Button components
│       │   ├── cards/           # Card components
│       │   ├── forms/           # Form components
│       │   ├── data/            # Data display components
│       │   └── layout/          # Layout components
│       └── package.json
│
└── 📁 supabase/                 # Supabase configuration
    ├── migrations/              # Database migrations
    └── config.toml              # Supabase config
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Supabase Account** (for database and auth)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd college-erp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create `.env` files in each portal and backend:

   **Admin Portal** (`admin-portal/.env`):
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_ADMIN_API_URL=http://localhost:4001
   ```

   **Professor Portal** (`professor-portal/.env`):
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_ACADEMIC_API_URL=http://localhost:4002
   ```

   **Student Portal** (`student-portal/.env`):
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_ACADEMIC_API_URL=http://localhost:4002
   ```

   **Admin Backend** (`admin-backend/.env`):
   ```env
   PORT=4001
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   NODE_ENV=development
   ```

   **Academic Backend** (`academic-backend/.env`):
   ```env
   PORT=4002
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   NODE_ENV=development
   ```

4. **Set up Supabase database**
   - Create a new Supabase project
   - Run migrations from `supabase/migrations/`
   - Set up Row Level Security (RLS) policies
   - Configure authentication providers

---

## 💻 Development

### Run All Services

```bash
# Run all frontends (ports 5173, 5174, 5175)
npm run dev:all-frontends

# Run all backends (ports 4001, 4002)
npm run dev:all-backends

# Run everything
npm run dev:all
```

### Run Individual Services

```bash
# Admin Portal (http://localhost:5173)
npm run dev:admin

# Professor Portal (http://localhost:5174)
npm run dev:professor

# Student Portal (http://localhost:5175)
npm run dev:student

# Admin Backend API (http://localhost:4001)
npm run dev:admin-api

# Academic Backend API (http://localhost:4002)
npm run dev:academic-api
```

### Build for Production

```bash
# Build all portals and backends
npm run build:all

# Build individual services
npm run build:admin
npm run build:professor
npm run build:student
npm run build:admin-api
npm run build:academic-api
```

### Code Quality

```bash
# Lint all code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting
npm run format:check

# Type check
npm run typecheck
```

---

## 📡 API Documentation

### Admin Backend API (Port 4001)

**Base URL**: `http://localhost:4001/api/admin/v1`

#### Authentication
```
POST   /auth/login              # Admin login
POST   /auth/logout             # Admin logout
GET    /auth/me                 # Get current user
```

#### Professors
```
POST   /professors              # Create professor
GET    /professors              # List all professors
GET    /professors/:id          # Get professor details
PUT    /professors/:id          # Update professor
DELETE /professors/:id          # Soft delete professor
```

#### Students
```
POST   /students                # Register student
GET    /students                # List all students
GET    /students/:id            # Get student details
PUT    /students/:id            # Update student
DELETE /students/:id            # Soft delete student
```

#### Academic Structure
```
POST   /batches                 # Create batch
GET    /batches                 # List batches
POST   /batches/:id/courses     # Link course to batch
POST   /courses                 # Create course
GET    /courses                 # List courses
POST   /branches                # Create branch
GET    /branches                # List branches
POST   /classes                 # Create class
GET    /classes                 # List classes
PUT    /classes/:id/students    # Assign students to class
PUT    /classes/:id/subjects    # Add subject to class
PUT    /classes/:id/timetable   # Upload timetable
PUT    /classes/:id/cr          # Assign CR
```

### Academic Backend API (Port 4002)

**Base URL**: `http://localhost:4002/api/academic/v1`

#### Timetable
```
GET    /timetable/:classId      # Get class timetable
GET    /my-timetable            # Get user's timetable
```

#### Attendance
```
POST   /attendance              # Take attendance
GET    /attendance/:classSubjectId  # Get attendance history
PUT    /attendance/:sessionId   # Edit attendance session
GET    /my-attendance           # Student's attendance
```

#### Marks
```
POST   /marks                   # Upload marks
GET    /marks/:classSubjectId   # Get marks for subject
GET    /my-marks                # Student's marks
```

#### Groups
```
GET    /groups                  # Get user's groups
POST   /groups/:id/messages     # Send message
GET    /groups/:id/messages     # Get messages
```

#### Notifications
```
GET    /notifications           # Get user notifications
PUT    /notifications/:id/read  # Mark as read
```

---

## 🗄️ Database Schema

### Core Tables

**Identity & Authentication**
- `users` - All system users (email, role, auth)
- `student_profiles` - Student-specific data
- `professor_profiles` - Professor-specific data

**Academic Structure**
- `departments` - Academic departments
- `academic_years` - Academic year definitions
- `semesters` - Semester periods
- `batches` - Student batches (2023-2027, etc.)
- `courses` - Degree programs (B.Tech, MBA)
- `branches` - Specializations (CSE, ECE)
- `sections` - Section labels (A, B, C)
- `classes` - Operational units (batch+course+branch+section)

**Relationships**
- `batch_courses` - Many-to-many: batches ↔ courses
- `batch_branches` - Many-to-many: batches ↔ branches
- `class_students` - Students assigned to classes
- `class_subjects` - Subjects taught in classes (with professor)

**Operations**
- `attendance_sessions` - Each class session
- `attendance_records` - Individual student attendance
- `assessment_components` - Marks columns (Minor 1, Assignment)
- `student_marks` - Individual marks

**Timetables**
- `timetables` - Timetable metadata
- `timetable_slots` - Individual time slots

**Communication**
- `groups` - Communication groups
- `group_members` - Group membership
- `group_messages` - Messages in groups
- `announcements` - College-wide announcements
- `notifications` - User-specific notifications

For complete schema, see `docs/database_schema_doc.md`

---

## 🎨 Design System

### Color Palette

**Primary Colors**
- Blue: `#0066FF`
- Indigo: `#6366F1`
- Teal: `#14B8A6`

**Semantic Colors**
- Success: `#10B981` (Green)
- Warning: `#F59E0B` (Orange)
- Error: `#EF4444` (Red)
- Info: `#3B82F6` (Blue)

**Neutral Colors**
- Background: `#0F172A` (Dark slate)
- Surface: `#1E293B` (Slate)
- Border: `#334155` (Light slate)
- Text: `#F1F5F9` (Off-white)

### Typography

- **Font Family**: Inter, system-ui, sans-serif
- **Headings**: Bold, 24-32px
- **Body**: Regular, 14-16px
- **Small**: Regular, 12-14px

### Components

- **Cards**: Glassmorphism effect with backdrop blur
- **Buttons**: Rounded, gradient on hover
- **Inputs**: Dark background, light border
- **Modals**: Centered, backdrop blur
- **Navigation**: Sidebar (desktop), Bottom tabs (mobile)

For complete design system, see `docs/design_system_doc.md`

---

## 🚢 Deployment

### Environment Setup

**Development**
- Frontend: `localhost:5173-5175`
- Backend: `localhost:4001-4002`
- Database: Supabase development project

**Staging**
- Frontend: `staging.erp.college.com`
- Backend: `api-staging.erp.college.com`
- Database: Supabase staging project

**Production**
- Frontend: `erp.college.com`
- Backend: `api.erp.college.com`
- Database: Supabase production project

### Deployment Steps

1. **Build all services**
   ```bash
   npm run build:all
   ```

2. **Deploy frontends** (Vercel/Netlify)
   - Admin Portal: `admin-portal/dist`
   - Professor Portal: `professor-portal/dist`
   - Student Portal: `student-portal/dist`

3. **Deploy backends** (Railway/Render/AWS)
   - Admin Backend: `admin-backend/dist`
   - Academic Backend: `academic-backend/dist`

4. **Configure environment variables** on hosting platforms

5. **Run database migrations** on production Supabase

---

## 🤝 Contributing

### Development Workflow

1. Create a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make changes and commit
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

3. Run tests and linting
   ```bash
   npm run lint
   npm run typecheck
   ```

4. Push and create pull request
   ```bash
   git push origin feature/your-feature-name
   ```

### Coding Standards

- **TypeScript**: Use strict mode, no `any` types
- **React**: Functional components with hooks
- **Naming**: camelCase for variables, PascalCase for components
- **Comments**: JSDoc for functions, inline for complex logic
- **Commits**: Follow conventional commits (feat, fix, docs, etc.)

### Testing

- Write unit tests for utilities
- Write integration tests for API endpoints
- Test on both mobile and desktop viewports
- Ensure accessibility (ARIA labels, keyboard navigation)

---

## 📚 Documentation

- **[Architecture](docs/architecture_doc.md)** - System design and data flow
- **[Database Schema](docs/database_schema_doc.md)** - Complete database structure
- **[Design System](docs/design_system_doc.md)** - UI/UX guidelines
- **[User Flows](docs/user_flows_doc.md)** - Detailed user journeys
- **[Quick Start Guide](docs/quick_start_guide.md)** - Setup instructions

---

## 🔒 Security

- **Authentication**: Supabase Auth with JWT tokens
- **Authorization**: Row Level Security (RLS) policies
- **Input Validation**: Zod schemas on backend
- **SQL Injection**: Parameterized queries only
- **XSS Prevention**: React auto-escaping
- **CSRF Protection**: Supabase session tokens
- **Rate Limiting**: 100 requests/min per user
- **HTTPS**: Enforced in production

---

## 📊 Performance

- **Code Splitting**: Lazy loading by portal
- **Caching**: TanStack Query for server state
- **Optimization**: Virtual scrolling for large lists
- **Database**: Indexes on frequently queried columns
- **CDN**: Static assets served via CDN
- **Compression**: Gzip/Brotli enabled

---

## 🐛 Troubleshooting

### Common Issues

**Husky not found**
```bash
npm install
```

**Port already in use**
```bash
# Kill process on port
lsof -ti:5173 | xargs kill -9
```

**Supabase connection error**
- Check `.env` files for correct credentials
- Verify Supabase project is active
- Check network connectivity

**Build errors**
```bash
# Clean and rebuild
npm run clean
npm install
npm run build:all
```

---

## 📝 License

[Add your license here]

---

## 👥 Team

**Built with ❤️ for modern educational institutions**

---

## 🔗 Links

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Contact the development team
- Check documentation in `docs/` folder

---

**Last Updated**: April 2026
