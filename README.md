😴 SleepScore Buddy

Track your sleep. Earn rewards. Wake up better.

SleepScore Buddy is a gamified sleep tracking web app that helps users log their nightly sleep, monitor sleep quality over time, and stay motivated through a points-based reward system. Built with a modern React + TypeScript stack and backed by Supabase for real-time data persistence.
🔗 Live Demo: sleepscore-buddy.vercel.app

✨ Features

Sleep Logging — Log bedtime, wake time, and sleep quality each day
Sleep Score — Automatic score calculated based on duration and consistency
Weekly Insights — Visual breakdown of your sleep patterns over the past 7 days
Gamified Rewards — Earn points for streaks and healthy sleep habits
Responsive UI — Clean, accessible interface built with shadcn/ui and Tailwind CSS
Persistent Storage — User data stored and synced via Supabase (PostgreSQL)


🛠️ Tech Stack
LayerTechnologyFrontendReact 18 + TypeScriptStylingTailwind CSS + shadcn/uiBuild ToolViteBackend/DBSupabase (PostgreSQL + PL/pgSQL)DeploymentVercel

🚀 Getting Started
Prerequisites

Node.js v18+
A Supabase account (free tier works)

Installation
bash# 1. Clone the repo
git clone https://github.com/megha0812/sleepscore-buddy.git
cd sleepscore-buddy

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Add your Supabase URL and anon key to .env

# 4. Start the dev server
npm run dev
Open http://localhost:5173 in your browser.

🗂️ Project Structure
sleepscore-buddy/
├── public/             # Static assets
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Route-level page components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Supabase client & utilities
│   └── types/          # TypeScript type definitions
├── supabase/           # DB schema & migrations (PL/pgSQL)
├── .env                # Environment variables (not committed)
└── vite.config.ts      # Vite configuration

🔐 Environment Variables
Create a .env file in the root with:
envVITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

📊 Database
The app uses Supabase (PostgreSQL) for data persistence. Schema and migrations are in the /supabase directory, written in PL/pgSQL.
Key tables:

sleep_logs — Stores individual sleep entries (date, bedtime, wake time, quality rating)
users — User preferences and cumulative score
rewards — Reward milestones and streak tracking


🧩 Key Design Decisions

TypeScript throughout — Strict typing for all components, hooks, and API calls
shadcn/ui — Accessible, unstyled component primitives styled with Tailwind
Supabase over Firebase — Chose PostgreSQL for structured relational data and PL/pgSQL for server-side logic
Vite — Significantly faster dev server and build times vs CRA


📦 Deployment
Deployed on Vercel with automatic deploys on push to main.
bash# Build for production
npm run build

# Preview production build locally
npm run preview


