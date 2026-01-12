# UGC Commerce Engine - API Documentation

## Overview

The UGC Commerce Engine provides a comprehensive REST API for managing user-generated content, products, rights, and analytics. All API endpoints require authentication unless otherwise noted.

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication

Authentication is handled via NextAuth.js sessions. Include the session cookie in all requests.

---

## Authentication Endpoints

### POST /api/auth/register
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "name": "User Name"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "name": "..." }
  }
}
```

### GET/POST /api/auth/[...nextauth]
NextAuth.js authentication routes. See [NextAuth.js documentation](https://next-auth.js.org/getting-started/rest-api).

---

## Workspace Endpoints

### GET /api/workspaces
List all workspaces for the current user.

**Response:**
```json
{
  "success": true,
  "data": {
    "workspaces": [
      { "id": "...", "name": "...", "slug": "...", "role": "OWNER" }
    ]
  }
}
```

### POST /api/workspaces
Create a new workspace.

**Request Body:**
```json
{
  "name": "My Brand",
  "slug": "my-brand" // optional
}
```

### GET /api/workspaces/[slug]
Get workspace details.

### PATCH /api/workspaces/[slug]
Update workspace settings. Requires `admin` permission.

### DELETE /api/workspaces/[slug]
Delete workspace. Requires `owner` permission.

---

## Member Endpoints

### GET /api/workspaces/[slug]/members
List workspace members and pending invitations.

### POST /api/workspaces/[slug]/members
Invite a new member. Requires `admin` permission.

**Request Body:**
```json
{
  "email": "member@example.com",
  "role": "MEMBER" // ADMIN, MEMBER, or ANALYST
}
```

### PATCH /api/workspaces/[slug]/members/[memberId]
Update member role.

### DELETE /api/workspaces/[slug]/members/[memberId]
Remove member from workspace.

---

## Product Endpoints

### GET /api/workspaces/[slug]/products
List products with filtering and pagination.

**Query Parameters:**
- `search`: Search by title
- `provider`: Filter by provider (SHOPIFY, MANUAL)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `sortBy`: Sort field (default: createdAt)
- `sortOrder`: asc or desc

### POST /api/workspaces/[slug]/products
Create a manual product.

**Request Body:**
```json
{
  "title": "Product Name",
  "price": 99.99,
  "url": "https://shop.com/product",
  "imageUrl": "https://...",
  "sku": "SKU123",
  "description": "..."
}
```

### GET /api/workspaces/[slug]/products/[productId]
Get product details with associated content.

### PATCH /api/workspaces/[slug]/products/[productId]
Update product.

### DELETE /api/workspaces/[slug]/products/[productId]
Delete product.

### POST /api/workspaces/[slug]/products/import/shopify
Import products from Shopify.

**Request Body:**
```json
{
  "shopDomain": "mystore.myshopify.com",
  "accessToken": "shpat_...",
  "limit": 50 // optional
}
```

---

## UGC Endpoints

### GET /api/workspaces/[slug]/ugc
List UGC posts with filtering.

**Query Parameters:**
- `platform`: TIKTOK, INSTAGRAM, YOUTUBE, MANUAL
- `rightsStatus`: PENDING, REQUESTED, APPROVED, DENIED, EXPIRED
- `creatorHandle`: Filter by creator
- `hashtag`: Filter by hashtag
- `search`: Search in caption
- `dateFrom`, `dateTo`: Date range

### POST /api/workspaces/[slug]/ugc
Import a UGC post manually.

**Request Body:**
```json
{
  "postUrl": "https://tiktok.com/@user/video/123",
  "platform": "TIKTOK",
  "creatorHandle": "user",
  "creatorName": "User Name",
  "caption": "...",
  "hashtags": ["ugc", "brand"],
  "metrics": { "views": 1000 },
  "postedAt": "2024-01-01T00:00:00Z"
}
```

### POST /api/workspaces/[slug]/ugc/import/csv
Bulk import UGC posts via CSV.

**Request Body (multipart/form-data or JSON):**
```json
{
  "posts": [
    { "postUrl": "...", "platform": "...", "creatorHandle": "..." }
  ]
}
```

### GET /api/workspaces/[slug]/ugc/[postId]
Get UGC post details with media and rights info.

### DELETE /api/workspaces/[slug]/ugc/[postId]
Delete UGC post.

---

## Rights Endpoints

### GET /api/workspaces/[slug]/rights
List rights requests with status counts.

**Query Parameters:**
- `status`: PENDING, REQUESTED, APPROVED, DENIED, EXPIRED
- `page`, `limit`: Pagination

### POST /api/workspaces/[slug]/rights
Create a rights request for a UGC post.

**Request Body:**
```json
{
  "ugcPostId": "...",
  "requestMessage": "Hi! We'd love to feature your content...",
  "requestMethod": "dm"
}
```

### GET /api/workspaces/[slug]/rights/templates
Get predefined message templates.

### GET /api/workspaces/[slug]/rights/[requestId]
Get rights request details.

### PATCH /api/workspaces/[slug]/rights/[requestId]
Update rights request status.

**Request Body:**
```json
{
  "status": "APPROVED",
  "proofUrl": "https://...",
  "notes": "Creator approved via DM"
}
```

---

## Media Endpoints

### GET /api/workspaces/[slug]/media
List media assets.

### POST /api/workspaces/[slug]/media
Create media asset record.

### POST /api/workspaces/[slug]/media/upload
Get presigned URL for direct upload.

**Request Body:**
```json
{
  "filename": "video.mp4",
  "contentType": "video/mp4",
  "type": "video"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://s3...",
    "storageKey": "workspace-id/video/123-video.mp4",
    "expiresIn": 3600
  }
}
```

---

## Repurpose Endpoints

### GET /api/workspaces/[slug]/repurpose
List repurposing jobs.

### POST /api/workspaces/[slug]/repurpose
Create a clip generation job.

**Request Body:**
```json
{
  "sourceMediaAssetId": "...",
  "params": {
    "clipDurations": [10, 20, 30],
    "formats": ["9_16", "1_1", "16_9"],
    "captionStyle": "default",
    "autoCaption": true
  }
}
```

### GET /api/workspaces/[slug]/repurpose/[jobId]
Get job status and generated clips.

### DELETE /api/workspaces/[slug]/repurpose/[jobId]
Cancel a pending job.

---

## Clips Endpoints

### GET /api/workspaces/[slug]/clips
List repurposed clips.

### POST /api/workspaces/[slug]/clips
Tag products to a clip.

**Request Body:**
```json
{
  "clipId": "...",
  "productIds": ["...", "..."],
  "placement": { "position": "bottom" }
}
```

---

## Shoppable Pages Endpoints

### GET /api/workspaces/[slug]/pages
List shoppable pages.

### POST /api/workspaces/[slug]/pages
Create a shoppable page.

**Request Body:**
```json
{
  "title": "Summer Collection",
  "slug": "summer-2024", // optional
  "theme": {
    "primaryColor": "#000",
    "backgroundColor": "#fff"
  }
}
```

### GET /api/workspaces/[slug]/pages/[pageId]
Get page with content tiles.

### PATCH /api/workspaces/[slug]/pages/[pageId]
Update page (title, theme, publish status).

### DELETE /api/workspaces/[slug]/pages/[pageId]
Delete page.

---

## Campaign Endpoints

### GET /api/workspaces/[slug]/campaigns
List marketing campaigns.

### POST /api/workspaces/[slug]/campaigns
Create a campaign with UTM parameters.

**Request Body:**
```json
{
  "name": "Summer Sale",
  "utmSource": "ugc",
  "utmMedium": "social",
  "utmCampaign": "summer-2024",
  "landingSlug": "summer-sale"
}
```

---

## Analytics Endpoints

### GET /api/workspaces/[slug]/analytics
Get analytics dashboard data.

**Query Parameters:**
- `period`: 7d, 30d, 90d, all (default: 30d)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalViews": 10000,
      "totalClicks": 500,
      "totalPurchases": 50,
      "totalRevenue": 4999.50
    },
    "dailyMetrics": [...],
    "topContent": [...],
    "campaignBreakdown": [...]
  }
}
```

---

## Events Endpoints

### GET /api/workspaces/[slug]/events
List tracked events.

### POST /api/workspaces/[slug]/events
Track an event (page view, click, purchase).

**Request Body:**
```json
{
  "type": "PRODUCT_CLICK",
  "sessionId": "...",
  "contentId": "...",
  "productId": "...",
  "utm": { "source": "...", "campaign": "..." }
}
```

---

## Billing Endpoints

### GET /api/workspaces/[slug]/billing
Get billing info and usage limits. Requires `owner` permission.

### POST /api/workspaces/[slug]/billing
Create Stripe checkout session for plan upgrade.

**Request Body:**
```json
{
  "plan": "GROWTH" // STARTER, GROWTH, or SCALE
}
```

### POST /api/workspaces/[slug]/billing/portal
Create Stripe billing portal session.

---

## Webhooks

### POST /api/webhooks/stripe
Stripe webhook handler for subscription events.

---

## Public Endpoints

### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": "connected"
  }
}
```

### GET /api/invite/[token]
Get invitation details (for displaying to user).

### POST /api/invite/[token]
Accept workspace invitation.

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {} // optional validation errors
  }
}
```

Common error codes:
- `UNAUTHORIZED`: Not authenticated
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid input
- `INTERNAL_ERROR`: Server error
