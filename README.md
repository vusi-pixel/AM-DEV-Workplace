# AM DEV Pro Workplace

> Enterprise corporate workplace management platform inspired by Microsoft SharePoint, Microsoft Teams, and modern HR systems.

![License](https://img.shields.io/badge/License-Proprietary-blue.svg)
![Node](https://img.shields.io/badge/Node.js-v18%2B-green.svg)
![React](https://img.shields.io/badge/React-18-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)
![Tailwind](https://img.shields.io/badge/TailwindCSS-v3-38bdf8.svg)

---

## 🏛️ Platform Highlights

* **Unified Shift Attendance Enforcement**: Interactive clock-in/out console with live shift duration ticker, geofence verification mode (*On-Site Dedicated* vs. *Remote/Hybrid*), and historical correction requests.
* **Hybrid Work Mode Governance**: Employee arrangement applications (*Hybrid 2-3*, *Full Remote*, *Dedicated On-Site*) with manager & HR approval workflows.
* **Microsoft SharePoint & Teams Department Workspaces**: Dedicated department hubs (*Engineering*, *Human Resources*, *Finance & Legal*, *Ops Governance*) with document libraries and real-time threaded channel discussions.
* **Leave & PTO Management**: Statutory balance meters (*Annual*, *Sick*, *Personal*, *Special*) with leave booking modals and HR approval queues.
* **Enterprise Security & Audit**: SOC2/ISO compliant immutable audit log tracking all logins, clock-ins, and permission updates with IP addresses and actor metadata.
* **Role-Based Access Control (RBAC)**: Fine-grained permissions across 5 system roles (*System Administrator*, *HR Manager*, *Finance Manager*, *Supervisor*, *Employee*).

---

## 🚀 Quick Start

### 1. Requirements
* [Node.js](https://nodejs.org/) (v18 or higher)
* npm (v9 or higher)

### 2. Fast Launch (Windows)
Double-click `start.bat` or run in PowerShell:
```powershell
./run.ps1
```

### 3. Manual Launch

#### Start Backend:
```bash
cd backend
npm install
node server.js
# API running on http://localhost:3001
```

#### Start Frontend:
```bash
cd frontend
npm install
npm run dev
# Frontend running on http://localhost:5174
```

---

## 🔑 Pre-Configured Test Accounts

The platform includes 1-click login shortcuts on the sign-in screen:

| Role | Email | Password | Responsibilities |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@amdev.com` | `Admin123!` | System governance, audit logs, RBAC matrix, all portals |
| **HR Manager** | `hr@amdev.com` | `Admin123!` | Attendance monitoring, staff leave reviews, hybrid mode desk |
| **Hybrid Engineer** | `hybrid.emp@amdev.com` | `Admin123!` | Remote clock-in privileges, engineering sprint hub |
| **On-Site Developer** | `employee@amdev.com` | `Admin123!` | Dedicated on-site attendance, leave requests |

---

## 📁 Repository Structure

```
├── backend/
│   ├── prisma/             # Prisma schema and seed scripts
│   ├── src/
│   │   ├── config/         # App configuration, logger, and mock persistence
│   │   ├── controllers/    # API endpoint controllers (auth, attendance, hr, admin...)
│   │   ├── middleware/     # Auth, session hydration, validation, error handler
│   │   ├── routes/         # Express API v1 route definitions
│   │   ├── services/       # Core business logic & database queries
│   │   ├── utils/          # Standard response helpers & custom error classes
│   │   └── validators/     # Zod schema validators
│   ├── package.json
│   └── server.js           # Server entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Header, Sidebar, AttendanceBanner, ProtectedRoute
│   │   ├── context/        # AuthContext and permission evaluation
│   │   ├── pages/          # Login, Dashboard, Attendance, WorkMode, Leave, Workspaces, Admin
│   │   ├── services/       # Axios API client with interceptors
│   │   ├── types/          # TypeScript interfaces (User, Attendance, Leave...)
│   │   ├── App.tsx         # Client-side routing
│   │   ├── index.css       # Tailwind CSS & enterprise design system
│   │   └── main.tsx        # React root entry
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── start.bat               # Windows batch launcher
├── run.ps1                 # PowerShell launcher
└── docker-compose.yml      # Optional PostgreSQL Docker environment
```

---

## 🔒 Security & Persistence
* **Session Management**: PostgreSQL-backed session store (`connect-pg-simple`) with transparent in-memory development fallback.
* **HTTP-Only Cookies**: Secure, HttpOnly, Lax/Strict same-site session cookies preventing XSS token exfiltration.
* **Audit Trail**: Every critical action (`AUTH_LOGIN`, `ATTENDANCE_CLOCK_IN`, `ROLE_ASSIGNED`, etc.) is recorded immutably.
