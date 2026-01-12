# UGC Commerce Engine

A multi-tenant SaaS platform for DTC brands to manage user-generated content, rights, repurpose videos, and track revenue attribution.

## Features

- 🎥 **UGC Ingestion** - Import content from TikTok, Instagram, YouTube, or manually
- ✅ **Rights Management** - Request and track content usage permissions
- ✂️ **Video Repurposing** - Generate platform-ready clips with captions
- 🛒 **Shoppable Content** - Tag products and create shoppable galleries
- 📊 **Revenue Analytics** - Track attribution from content to conversions
- 💳 **Stripe Billing** - Subscription tiers with usage limits

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Queue**: BullMQ + Redis
- **Storage**: S3-compatible (Cloudflare R2 / AWS S3 / MinIO)
- **Auth**: NextAuth.js (Google OAuth + Credentials)
- **Payments**: Stripe

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker (for local services)

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd ugc-commerce-engine

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Start local services (Postgres, Redis, MinIO)
docker-compose up -d

# Run database migrations
pnpm db:migrate:dev

# Seed demo data
pnpm db:seed

# Start development server
pnpm dev
```

Visit http://localhost:3000

**Demo Account:**
- Email: `demo@example.com`
- Password: `Demo123!`

## Project Structure

```
├── apps/
│   ├── web/              # Next.js frontend + API
│   └── worker/           # Background job processor
├── packages/
│   ├── database/         # Prisma schema & migrations
│   └── shared/           # Types, schemas, utilities
└── docs/                 # Documentation
```

## Scripts

```bash
# Development
pnpm dev              # Start all services in dev mode
pnpm build            # Build all packages
pnpm test             # Run tests

# Database
pnpm db:migrate:dev   # Create and apply migrations (dev)
pnpm db:migrate       # Apply migrations (production)
pnpm db:generate      # Generate Prisma client
pnpm db:seed          # Seed database with demo data

# Production
pnpm start            # Start production server
pnpm start:prod       # Run migrations + start server
```

## API Documentation

See [docs/API.md](docs/API.md) for complete API reference.

## Deployment

Configured for Railway deployment. See [docs/RUNBOOK.md](docs/RUNBOOK.md) for detailed deployment instructions.

### Required Environment Variables

```bash
DATABASE_URL          # PostgreSQL connection string
REDIS_URL             # Redis connection string
NEXTAUTH_URL          # Your app URL
NEXTAUTH_SECRET       # Session encryption secret
S3_ENDPOINT           # S3-compatible storage endpoint
S3_ACCESS_KEY         # Storage access key
S3_SECRET_KEY         # Storage secret key
S3_BUCKET             # Storage bucket name
```

## License

Private - All rights reserved
