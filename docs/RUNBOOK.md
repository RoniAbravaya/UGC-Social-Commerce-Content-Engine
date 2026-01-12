# UGC Commerce Engine - MVP Runbook

## Overview

The UGC Commerce Engine is a multi-tenant SaaS application for managing user-generated content, rights management, video repurposing, and shoppable content for DTC brands.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│                   (Next.js App Router)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Routes                              │
│              (Next.js Route Handlers)                        │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  PostgreSQL │      │    Redis    │      │  S3/R2/MinIO│
│   (Prisma)  │      │  (BullMQ)   │      │   Storage   │
└─────────────┘      └─────────────┘      └─────────────┘
                              │
                              ▼
                     ┌─────────────┐
                     │   Worker    │
                     │  (BullMQ)   │
                     └─────────────┘
```

## Project Structure

```
/
├── apps/
│   ├── web/              # Next.js frontend + API
│   │   ├── src/
│   │   │   ├── app/      # App Router pages & API routes
│   │   │   ├── components/
│   │   │   └── lib/      # Utilities (auth, stripe, s3)
│   │   └── package.json
│   └── worker/           # BullMQ background jobs
│       └── src/
├── packages/
│   ├── database/         # Prisma schema & client
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       ├── seed.ts
│   │       └── migrations/
│   └── shared/           # Shared types, schemas, utils
│       └── src/
├── docs/                 # Documentation
├── docker-compose.yml    # Local development services
├── railway.json          # Railway deployment config
└── package.json          # Root monorepo config
```

## Local Development Setup

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker (for local Postgres, Redis, MinIO)

### 1. Clone and Install

```bash
git clone <repository-url>
cd ugc-commerce-engine
pnpm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your values
```

Required for local development:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Random secret for sessions
- `NEXTAUTH_URL` - http://localhost:3000

### 3. Start Services

```bash
# Start Postgres, Redis, MinIO
docker-compose up -d

# Run database migrations
pnpm db:migrate:dev

# Seed demo data
pnpm db:seed
```

### 4. Start Development Server

```bash
pnpm dev
```

Visit http://localhost:3000

Demo credentials:
- Email: `demo@example.com`
- Password: `Demo123!`

## Production Deployment (Railway)

### 1. Create Railway Project

1. Connect your GitHub repository to Railway
2. Railway will auto-detect the configuration from `railway.json`

### 2. Add Services

Add the following services in Railway:
- **PostgreSQL** - Railway managed
- **Redis** - Railway managed

### 3. Configure Environment Variables

Set these in Railway's Environment Variables:

```
# Required
DATABASE_URL=<auto-set by Railway>
REDIS_URL=<auto-set by Railway>
NEXTAUTH_URL=https://your-app.railway.app
NEXTAUTH_SECRET=<generate-secure-secret>

# S3 Storage (Cloudflare R2 or AWS S3)
S3_ENDPOINT=https://your-bucket.r2.cloudflarestorage.com
S3_ACCESS_KEY=<your-access-key>
S3_SECRET_KEY=<your-secret-key>
S3_BUCKET=ugc-media
S3_REGION=auto

# Optional but recommended
GOOGLE_CLIENT_ID=<for-oauth>
GOOGLE_CLIENT_SECRET=<for-oauth>

# Stripe (for billing)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_GROWTH=price_...
STRIPE_PRICE_SCALE=price_...
```

### 4. Deploy

Push to your repository - Railway will auto-deploy.

The deployment process:
1. `pnpm install` - Install dependencies
2. `pnpm build` - Generate Prisma client + build Next.js
3. `pnpm start:prod` - Run migrations + start server

### 5. Verify Deployment

Check the health endpoint:
```bash
curl https://your-app.railway.app/api/health
```

## Database Management

### Run Migrations (Development)

```bash
pnpm db:migrate:dev
```

### Run Migrations (Production)

Automatically runs on deploy via `start:prod` script, or manually:

```bash
pnpm db:migrate
```

### Generate Prisma Client

```bash
pnpm db:generate
```

### Seed Database

```bash
pnpm db:seed
```

### Reset Database (Development Only)

```bash
pnpm --filter @ugc/database db:push --force-reset
pnpm db:seed
```

## Background Jobs (Worker)

The worker service handles:
- Media download and transcoding
- Clip generation (FFmpeg)
- Caption generation (Whisper)
- UGC ingestion from platforms

### Start Worker (Development)

```bash
pnpm --filter @ugc/worker dev
```

### Monitor Jobs

Use Redis CLI or a tool like Bull Board to monitor job queues.

## Testing

### Run Unit Tests

```bash
pnpm test
```

### Run Tests in Watch Mode

```bash
pnpm --filter @ugc/shared test:watch
```

## Monitoring

### Health Check

The `/api/health` endpoint returns:
- Overall status
- Database connectivity
- Service version

### Logs

- Development: Console output
- Railway: Use Railway's logging dashboard

## Security Considerations

1. **Environment Variables**: Never commit secrets to git
2. **Session Security**: Use strong `NEXTAUTH_SECRET`
3. **CORS**: Configure for your domains only
4. **Rate Limiting**: Consider adding rate limiting in production
5. **Stripe Webhooks**: Verify webhook signatures
6. **OAuth Tokens**: Stored encrypted in database

## Troubleshooting

### Build Fails

1. Check Node.js version (18+)
2. Run `pnpm install` fresh
3. Verify Prisma client: `pnpm db:generate`

### Database Connection Issues

1. Check `DATABASE_URL` format
2. Ensure PostgreSQL is running
3. Check network/firewall settings

### S3 Upload Issues

1. Verify S3 credentials
2. Check bucket CORS configuration
3. Ensure bucket exists and is accessible

### Authentication Issues

1. Verify `NEXTAUTH_URL` matches your domain
2. Check Google OAuth credentials are configured
3. Ensure `NEXTAUTH_SECRET` is set

## API Rate Limits

Current MVP limits by plan:
- **Free**: 50 UGC posts, 10 clips, 1 page, 2 members
- **Starter**: 500 UGC posts, 100 clips, 5 pages, 5 members
- **Growth**: 2000 UGC posts, 500 clips, 20 pages, 15 members
- **Scale**: 10000 UGC posts, 2000 clips, 100 pages, 50 members

## Support

For issues or questions:
1. Check this runbook
2. Review API documentation (`docs/API.md`)
3. Check application logs
4. Open a GitHub issue
