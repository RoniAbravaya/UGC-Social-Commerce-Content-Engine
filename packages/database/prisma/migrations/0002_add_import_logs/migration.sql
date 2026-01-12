-- CreateEnum
CREATE TYPE "ImportLogStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "ImportLogStep" AS ENUM ('VALIDATING', 'CHECKING_DUPLICATE', 'EXTRACTING_HASHTAGS', 'CREATING_POST', 'CREATING_RIGHTS_REQUEST', 'FETCHING_MEDIA', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "import_logs" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" "ImportLogStatus" NOT NULL DEFAULT 'PENDING',
    "totalItems" INTEGER NOT NULL DEFAULT 1,
    "processed" INTEGER NOT NULL DEFAULT 0,
    "succeeded" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_log_entries" (
    "id" TEXT NOT NULL,
    "importLogId" TEXT NOT NULL,
    "step" "ImportLogStep" NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "import_logs_workspaceId_createdAt_idx" ON "import_logs"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "import_log_entries_importLogId_createdAt_idx" ON "import_log_entries"("importLogId", "createdAt");

-- AddForeignKey
ALTER TABLE "import_logs" ADD CONSTRAINT "import_logs_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_log_entries" ADD CONSTRAINT "import_log_entries_importLogId_fkey" FOREIGN KEY ("importLogId") REFERENCES "import_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
