-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'ANALYST');

-- CreateEnum
CREATE TYPE "WorkspacePlan" AS ENUM ('FREE', 'STARTER', 'GROWTH', 'SCALE');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('TIKTOK', 'INSTAGRAM', 'YOUTUBE', 'MANUAL');

-- CreateEnum
CREATE TYPE "SocialAccountStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'EXPIRED', 'ERROR');

-- CreateEnum
CREATE TYPE "RightsStatus" AS ENUM ('PENDING', 'REQUESTED', 'APPROVED', 'DENIED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('VIDEO', 'IMAGE');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('PENDING', 'DOWNLOADING', 'PROCESSING', 'READY', 'ERROR');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ClipFormat" AS ENUM ('VERTICAL_9_16', 'SQUARE_1_1', 'HORIZONTAL_16_9');

-- CreateEnum
CREATE TYPE "ProductProvider" AS ENUM ('SHOPIFY', 'MANUAL');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('PAGE_VIEW', 'VIDEO_VIEW', 'VIDEO_PLAY', 'VIDEO_COMPLETE', 'PRODUCT_CLICK', 'ADD_TO_CART', 'CHECKOUT_START', 'PURCHASE');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'DENY', 'PUBLISH', 'UNPUBLISH', 'EXPORT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "image" TEXT,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" "WorkspacePlan" NOT NULL DEFAULT 'FREE',
    "stripeCustomerId" TEXT,
    "subscriptionId" TEXT,
    "subscriptionStatus" TEXT,
    "logoUrl" TEXT,
    "domain" TEXT,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_members" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_invitations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'MEMBER',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_accounts" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "handle" TEXT NOT NULL,
    "displayName" TEXT,
    "profileUrl" TEXT,
    "profileImageUrl" TEXT,
    "authTokensEncrypted" TEXT,
    "status" "SocialAccountStatus" NOT NULL DEFAULT 'CONNECTED',
    "lastSyncAt" TIMESTAMP(3),
    "syncSettings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ugc_posts" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "socialAccountId" TEXT,
    "platform" "Platform" NOT NULL,
    "postUrl" TEXT NOT NULL,
    "postId" TEXT,
    "creatorHandle" TEXT NOT NULL,
    "creatorName" TEXT,
    "creatorProfileUrl" TEXT,
    "caption" TEXT,
    "hashtags" TEXT[],
    "mentions" TEXT[],
    "metricsJson" JSONB,
    "postedAt" TIMESTAMP(3),
    "thumbnailUrl" TEXT,
    "rawJson" JSONB,
    "importSource" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ugc_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rights_requests" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "ugcPostId" TEXT NOT NULL,
    "status" "RightsStatus" NOT NULL DEFAULT 'PENDING',
    "requestMessage" TEXT,
    "requestMethod" TEXT,
    "requestSentAt" TIMESTAMP(3),
    "proofUrl" TEXT,
    "proofNotes" TEXT,
    "approvedAt" TIMESTAMP(3),
    "deniedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rights_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "ugcPostId" TEXT,
    "type" "MediaType" NOT NULL,
    "storageUrl" TEXT,
    "storageKey" TEXT,
    "originalUrl" TEXT,
    "duration" DOUBLE PRECISION,
    "width" INTEGER,
    "height" INTEGER,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "status" "MediaStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repurpose_jobs" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "sourceMediaAssetId" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "paramsJson" JSONB NOT NULL,
    "outputSummaryJson" JSONB,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repurpose_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repurposed_clips" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "sourceMediaAssetId" TEXT NOT NULL,
    "repurposeJobId" TEXT,
    "storageUrl" TEXT,
    "storageKey" TEXT,
    "format" "ClipFormat" NOT NULL,
    "duration" DOUBLE PRECISION,
    "width" INTEGER,
    "height" INTEGER,
    "startTime" DOUBLE PRECISION,
    "endTime" DOUBLE PRECISION,
    "captionTrackUrl" TEXT,
    "captionBurnedIn" BOOLEAN NOT NULL DEFAULT false,
    "captionStyle" JSONB,
    "thumbnailUrl" TEXT,
    "status" "MediaStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repurposed_clips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "provider" "ProductProvider" NOT NULL DEFAULT 'MANUAL',
    "externalId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "imageUrl" TEXT,
    "url" TEXT NOT NULL,
    "sku" TEXT,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "syncedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_product_maps" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "ugcPostId" TEXT,
    "repurposedClipId" TEXT,
    "productId" TEXT NOT NULL,
    "placementJson" JSONB,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_product_maps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT NOT NULL,
    "utmContent" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shoppable_pages" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "campaignId" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "themeJson" JSONB,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shoppable_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shoppable_page_items" (
    "id" TEXT NOT NULL,
    "shoppablePageId" TEXT NOT NULL,
    "repurposedClipId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shoppable_page_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "sessionId" TEXT,
    "visitorId" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "pageUrl" TEXT,
    "ugcPostId" TEXT,
    "repurposedClipId" TEXT,
    "shoppablePageId" TEXT,
    "productId" TEXT,
    "revenueAmount" DECIMAL(10,2),
    "revenueCurrency" TEXT,
    "orderId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldData" JSONB,
    "newData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_slug_key" ON "workspaces"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_members_userId_workspaceId_key" ON "workspace_members"("userId", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_invitations_token_key" ON "workspace_invitations"("token");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_invitations_email_workspaceId_key" ON "workspace_invitations"("email", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "social_accounts_workspaceId_platform_handle_key" ON "social_accounts"("workspaceId", "platform", "handle");

-- CreateIndex
CREATE INDEX "ugc_posts_workspaceId_platform_idx" ON "ugc_posts"("workspaceId", "platform");

-- CreateIndex
CREATE INDEX "ugc_posts_workspaceId_creatorHandle_idx" ON "ugc_posts"("workspaceId", "creatorHandle");

-- CreateIndex
CREATE UNIQUE INDEX "ugc_posts_workspaceId_platform_postUrl_key" ON "ugc_posts"("workspaceId", "platform", "postUrl");

-- CreateIndex
CREATE UNIQUE INDEX "rights_requests_ugcPostId_key" ON "rights_requests"("ugcPostId");

-- CreateIndex
CREATE INDEX "rights_requests_workspaceId_status_idx" ON "rights_requests"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "media_assets_workspaceId_status_idx" ON "media_assets"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "repurpose_jobs_workspaceId_status_idx" ON "repurpose_jobs"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "repurposed_clips_workspaceId_format_idx" ON "repurposed_clips"("workspaceId", "format");

-- CreateIndex
CREATE INDEX "products_workspaceId_idx" ON "products"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "products_workspaceId_provider_externalId_key" ON "products"("workspaceId", "provider", "externalId");

-- CreateIndex
CREATE INDEX "content_product_maps_workspaceId_idx" ON "content_product_maps"("workspaceId");

-- CreateIndex
CREATE INDEX "campaigns_workspaceId_idx" ON "campaigns"("workspaceId");

-- CreateIndex
CREATE INDEX "shoppable_pages_workspaceId_isPublic_idx" ON "shoppable_pages"("workspaceId", "isPublic");

-- CreateIndex
CREATE UNIQUE INDEX "shoppable_pages_workspaceId_slug_key" ON "shoppable_pages"("workspaceId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "shoppable_page_items_shoppablePageId_repurposedClipId_key" ON "shoppable_page_items"("shoppablePageId", "repurposedClipId");

-- CreateIndex
CREATE INDEX "events_workspaceId_type_createdAt_idx" ON "events"("workspaceId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "events_workspaceId_sessionId_idx" ON "events"("workspaceId", "sessionId");

-- CreateIndex
CREATE INDEX "events_workspaceId_utmCampaign_idx" ON "events"("workspaceId", "utmCampaign");

-- CreateIndex
CREATE INDEX "audit_logs_workspaceId_entityType_entityId_idx" ON "audit_logs"("workspaceId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_workspaceId_createdAt_idx" ON "audit_logs"("workspaceId", "createdAt");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ugc_posts" ADD CONSTRAINT "ugc_posts_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ugc_posts" ADD CONSTRAINT "ugc_posts_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "social_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rights_requests" ADD CONSTRAINT "rights_requests_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rights_requests" ADD CONSTRAINT "rights_requests_ugcPostId_fkey" FOREIGN KEY ("ugcPostId") REFERENCES "ugc_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_ugcPostId_fkey" FOREIGN KEY ("ugcPostId") REFERENCES "ugc_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repurpose_jobs" ADD CONSTRAINT "repurpose_jobs_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repurpose_jobs" ADD CONSTRAINT "repurpose_jobs_sourceMediaAssetId_fkey" FOREIGN KEY ("sourceMediaAssetId") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repurposed_clips" ADD CONSTRAINT "repurposed_clips_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repurposed_clips" ADD CONSTRAINT "repurposed_clips_sourceMediaAssetId_fkey" FOREIGN KEY ("sourceMediaAssetId") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repurposed_clips" ADD CONSTRAINT "repurposed_clips_repurposeJobId_fkey" FOREIGN KEY ("repurposeJobId") REFERENCES "repurpose_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_product_maps" ADD CONSTRAINT "content_product_maps_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_product_maps" ADD CONSTRAINT "content_product_maps_ugcPostId_fkey" FOREIGN KEY ("ugcPostId") REFERENCES "ugc_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_product_maps" ADD CONSTRAINT "content_product_maps_repurposedClipId_fkey" FOREIGN KEY ("repurposedClipId") REFERENCES "repurposed_clips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_product_maps" ADD CONSTRAINT "content_product_maps_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shoppable_pages" ADD CONSTRAINT "shoppable_pages_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shoppable_pages" ADD CONSTRAINT "shoppable_pages_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shoppable_page_items" ADD CONSTRAINT "shoppable_page_items_shoppablePageId_fkey" FOREIGN KEY ("shoppablePageId") REFERENCES "shoppable_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shoppable_page_items" ADD CONSTRAINT "shoppable_page_items_repurposedClipId_fkey" FOREIGN KEY ("repurposedClipId") REFERENCES "repurposed_clips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
