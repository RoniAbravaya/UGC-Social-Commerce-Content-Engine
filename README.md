# UGC Commerce Engine

A multi-tenant SaaS platform for DTC brands to ingest user-generated content (UGC) from social platforms, manage usage rights, repurpose content into platform-ready clips, tag products with shoppable links, and track revenue attribution.

## Features

- **UGC Ingestion**: Import content from TikTok, Instagram, and YouTube by hashtag, mention, or handle
- **Rights Management**: Request and track content usage permissions with templated outreach
- **Repurpose Studio**: Auto-generate multiple clip variants with captions in platform-optimized formats
- **Product Tagging**: Connect Shopify and tag products in videos with shoppable links
- **Shoppable Pages**: Create branded landing pages featuring UGC with embedded product links
- **Revenue Attribution**: Track real sales with UTM links and pixel events

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Routes + Prisma ORM
- **Database**: PostgreSQL
- **Queue/Workers**: BullMQ + Redis
- **Storage**: S3-compatible (MinIO for dev, R2/S3 for production)
- **Auth**: NextAuth.js (email + Google OAuth)
- **Payments**: Stripe (subscriptions)

## Project Structure

```
├── apps/
│   ├── web/              # Next.js web application
│   └── worker/           # BullMQ background job workers
├── packages/
│   ├── database/         # Prisma schema and client
│   └── shared/           # Shared types, schemas, and utilities
├── docker-compose.yml    # Local development services
└── package.json          # Root package.json with workspaces
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker and Docker Compose

### Local Development Setup

1. **Clone and install dependencies**

```bash
git clone <repository-url>
cd ugc-commerce-engine
pnpm install
```

2. **Start local services** (PostgreSQL, Redis, MinIO)

```bash
docker-compose up -d
```

3. **Set up environment variables**

```bash
cp .env.example .env
```

Edit `.env` with your configuration. For local development, the defaults should work.

4. **Initialize the database**

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Seed with demo data
pnpm db:seed
```

5. **Start the development server**

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

### Demo Account

After seeding, you can log in with:
- **Email**: `demo@ugc-commerce.com`
- **Password**: `Demo1234!`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/ugc_commerce` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `NEXTAUTH_URL` | Application URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | JWT secret (generate with `openssl rand -base64 32`) | - |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | - |
| `S3_ENDPOINT` | S3-compatible storage endpoint | `http://localhost:9000` |
| `S3_ACCESS_KEY` | S3 access key | `minioadmin` |
| `S3_SECRET_KEY` | S3 secret key | `minioadmin` |
| `S3_BUCKET` | S3 bucket name | `ugc-media` |

## Development Commands

```bash
# Start all services
pnpm dev

# Run database migrations
pnpm db:migrate

# Open Prisma Studio
pnpm db:studio

# Run linting
pnpm lint

# Run tests
pnpm test

# Build for production
pnpm build
```

## Architecture

### Multi-tenancy

All core tables include a `workspaceId` foreign key for tenant isolation. RBAC is enforced at the API level with roles: Owner, Admin, Member, and Analyst.

### Background Jobs

The worker service handles async operations:
- **Media Download**: Fetch and store videos from source URLs
- **Media Transcode**: Convert videos to platform-specific formats
- **Clip Generation**: Auto-generate short clips from longer videos
- **Caption Generation**: Generate and burn-in captions using Whisper
- **UGC Ingestion**: Periodic fetching of new content from connected platforms

### Analytics & Attribution

Events are tracked with:
- Visitor session management
- UTM parameter tracking
- Product click and purchase events
- Revenue attribution to content and creators

## API Documentation

API documentation is available at `/api/docs` (coming soon).

## License

Proprietary - All rights reserved.
