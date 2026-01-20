# CSBG Standards - Compliance Management System

A comprehensive compliance and organizational standards management system, designed to track, monitor, and ensure adherence to regulations and best practices.

## 📋 Overview

CSBG Standards is a web platform that enables organizations to manage their compliance standards, track activities, and maintain evidence records and participation logs.

### Key Features

- **Standards Management**: Complete tracking of organizational standards by category
- **Personalized Dashboard**: Differentiated views for each access level
- **User System**: Complete management with multiple permission levels
- **Encrypted Messaging**: Secure communication between organization members
- **Announcements**: Organizational notifications and communications system
- **ROMA Reports**: Monitoring and analysis reports
- **Evidence Upload**: Secure storage of supporting documents
- **Activity Logs**: Complete record of all system actions

## 👥 Access Levels

| Role | Description |
|------|-------------|
| **Master Admin** | Global access to all organizations, admin creation and new organization provisioning |
| **Admin** | Complete management of their own organization and users |
| **Compliance Manager** | Standards and compliance management for the organization |
| **Staff** | Operational access to standards and basic features |
| **Board Member** | Dashboard and ROMA Reports access for oversight |

## 🛠️ Technologies Used

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend**: Lovable Cloud (Supabase)
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL
- **Storage**: Supabase Storage
- **Edge Functions**: Deno Runtime

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                    # Base components (shadcn/ui)
│   ├── standards/             # Standards components
│   │   └── configs/           # Centralized configurations
│   └── dashboard/             # Dashboard components
├── hooks/                     # Custom hooks
├── integrations/
│   └── supabase/              # Supabase client and types
├── lib/                       # Utilities
├── pages/                     # Application pages
└── index.css                  # Global styles and tokens

supabase/
└── functions/                 # Edge Functions
    ├── create-user/
    ├── delete-user/
    ├── encrypt-message/
    └── ...
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or bun

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

## 🔐 Environment Variables

The project uses the following variables (automatically configured by Lovable Cloud):

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase public key
- `VITE_SUPABASE_PROJECT_ID` - Project ID

## 📊 Features by Module

### Standards
- View by category (1.x to 9.x)
- Compliance status (Compliant, Pending, Submitted, Not Compliant)
- Evidence upload by participation method
- Activity and document logs
- PDF evidence packet generation

### Dashboard
- Global KPIs (Master Admin)
- Organizational metrics (Admin/Staff)
- Progress and compliance charts

### Management (User Management)
- User CRUD operations
- Role assignment
- Email invitations
- Multi-organization management (Master Admin)

### Inbox (Messages)
- Encrypted communication (AES-GCM)
- Unread message indicators
- Real-time via Supabase Realtime

### Announcements
- Create communications
- Organization-scoped or global
- Notifications with unread indicator

## 🔒 Security

- **RLS (Row Level Security)**: Access policies on all tables
- **Encryption**: End-to-end encrypted messages
- **Authentication**: Robust system with email confirmation
- **Inactivity Timeout**: Automatic logout on inactivity

## 📝 Available Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Build preview
npm run lint     # Code verification
```

## 🌐 Deployment

The project can be published directly through Lovable:

1. Access the Lovable editor
2. Click **Share** → **Publish**
3. The app will be available at `https://csbg-standards.lovable.app`

### Custom Domain

To connect a custom domain:
1. Navigate to **Project** → **Settings** → **Domains**
2. Click **Connect Domain**
3. Follow the DNS configuration instructions

## 📄 License

Proprietary project - All rights reserved.

---

**Production**: https://csbg-standards.lovable.app