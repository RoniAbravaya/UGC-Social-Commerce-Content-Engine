# UGC Commerce Engine - AI Overview

## Project Summary

A multi-tenant SaaS platform for DTC (Direct-to-Consumer) brands to manage user-generated content, handle rights/permissions, repurpose videos, create shoppable experiences, and track revenue attribution.

## Architecture

### Monorepo Structure

```
├── apps/
│   ├── web/              # Next.js 14 App Router application
│   └── worker/           # BullMQ background job workers
├── packages/
│   ├── database/         # Prisma schema, client, seed script
│   └── shared/           # Zod schemas, TypeScript types, utilities
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes, Prisma ORM |
| Database | PostgreSQL |
| Queue | BullMQ + Redis |
| Storage | S3-compatible (MinIO dev, R2/S3 prod) |
| Auth | NextAuth.js (credentials + Google) |
| Payments | Stripe subscriptions |

## Key Concepts

### Multi-tenancy

- **Workspace**: Top-level tenant (brand/company)
- **WorkspaceMember**: Users belong to workspaces with roles
- **RBAC Roles**: OWNER > ADMIN > MEMBER > ANALYST
- All data queries must filter by `workspaceId`

### Data Flow

1. **UGC Ingestion**: Posts imported manually or via API → `ugc_posts`
2. **Rights Management**: Request permissions → `rights_requests` (pending → approved)
3. **Media Processing**: Download media → transcode → `media_assets`
4. **Repurposing**: Generate clips → add captions → `repurposed_clips`
5. **Commerce**: Tag products → create shoppable pages → `shoppable_pages`
6. **Attribution**: Track events → `events` → revenue reporting

## Important Files

### Configuration

- `/package.json` - Root monorepo config with Turborepo
- `/apps/web/next.config.js` - Next.js configuration
- `/packages/database/prisma/schema.prisma` - Database schema

### Auth

- `/apps/web/src/lib/auth.ts` - NextAuth configuration
- `/apps/web/src/lib/workspace.ts` - Workspace context utilities
- `/apps/web/src/types/next-auth.d.ts` - Session type extensions

### API Routes

- `/apps/web/src/app/api/auth/[...nextauth]/route.ts` - Auth handler
- `/apps/web/src/app/api/workspaces/route.ts` - Workspace CRUD
- `/apps/web/src/app/api/workspaces/[slug]/members/route.ts` - Team management

### Shared Code

- `/packages/shared/src/schemas/` - Zod validation schemas
- `/packages/shared/src/types/` - TypeScript type definitions
- `/packages/shared/src/utils/` - Utility functions

## Conventions

### File Naming

- Components: PascalCase (`WorkspaceNav.tsx`)
- Utilities: camelCase (`workspace.ts`)
- API routes: lowercase with hyphens for dynamic segments

### API Response Format

```typescript
// Success
{ success: true, data: { ... } }

// Error
{ success: false, error: { code: 'ERROR_CODE', message: '...' } }
```

### Database

- All tables use `cuid()` for IDs
- Timestamps: `createdAt`, `updatedAt` on all models
- Soft deletes not used; cascade deletes configured in schema
- JSON columns for flexible metadata storage

## Current Implementation Status

### Milestone 1 (Completed)

- [x] Monorepo setup with Turborepo
- [x] Prisma schema with all data models
- [x] NextAuth with credentials + Google
- [x] Workspace CRUD API
- [x] Team member management
- [x] RBAC permission system
- [x] Dashboard layout and navigation
- [x] Docker Compose for local dev
- [x] Seed script with demo data

### Next Milestones

- [ ] Milestone 2: Products import (Shopify/manual)
- [ ] Milestone 3: UGC ingestion
- [ ] Milestone 4: Rights workflow
- [ ] Milestone 5: Media storage + workers
- [ ] Milestone 6: Repurpose Studio
- [ ] Milestone 7: Shoppable pages
- [ ] Milestone 8: Analytics
- [ ] Milestone 9: Stripe billing
- [ ] Milestone 10: Polish + tests

## Common Tasks

### Adding a New API Route

1. Create route file in `/apps/web/src/app/api/`
2. Add Zod schema in `/packages/shared/src/schemas/`
3. Use `getWorkspaceContext()` for authenticated workspace routes
4. Use `hasPermission()` for role checks
5. Add audit log for important actions

### Adding a New Page

1. Create page in `/apps/web/src/app/w/[slug]/`
2. Page component is server component by default
3. Use client components with `'use client'` directive as needed
4. Access workspace via `getWorkspaceContext(params.slug)`

### Adding a Background Job

1. Define queue in `/apps/worker/src/queues.ts`
2. Create worker handler in `/apps/worker/src/index.ts`
3. Export job creation function from queues

## Performance Considerations

- Use React Server Components by default
- Client components only for interactivity
- Implement pagination for list views (20 items default)
- Use database indexes (already defined in schema)
- Background jobs for heavy operations (video processing)
