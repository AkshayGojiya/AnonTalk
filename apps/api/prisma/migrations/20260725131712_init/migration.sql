-- CreateEnum
CREATE TYPE "UserMode" AS ENUM ('ANONYMOUS', 'REAL');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'MUTED', 'BANNED');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'HARASSMENT', 'HATE_SPEECH', 'THREATS', 'NSFW', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'ACTIONED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ModerationActionType" AS ENUM ('WARN', 'MUTE', 'BAN', 'UNMUTE', 'UNBAN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "googleId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "department" TEXT,
    "defaultMode" "UserMode" NOT NULL DEFAULT 'ANONYMOUS',
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "reputationScore" INTEGER NOT NULL DEFAULT 100,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "mutedUntil" TIMESTAMP(3),
    "bannedAt" TIMESTAMP(3),
    "banReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllowedDomain" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "collegeName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AllowedDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "details" TEXT,
    "messageBuffer" JSONB NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationAction" (
    "id" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "moderatorId" TEXT,
    "reportId" TEXT,
    "actionType" "ModerationActionType" NOT NULL,
    "reason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedUser" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockedUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_domain_idx" ON "User"("domain");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AllowedDomain_domain_key" ON "AllowedDomain"("domain");

-- CreateIndex
CREATE INDEX "Report_reportedUserId_status_idx" ON "Report"("reportedUserId", "status");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");

-- CreateIndex
CREATE INDEX "Report_reporterId_idx" ON "Report"("reporterId");

-- CreateIndex
CREATE INDEX "ModerationAction_targetUserId_createdAt_idx" ON "ModerationAction"("targetUserId", "createdAt");

-- CreateIndex
CREATE INDEX "BlockedUser_blockerId_idx" ON "BlockedUser"("blockerId");

-- CreateIndex
CREATE UNIQUE INDEX "BlockedUser_blockerId_blockedId_key" ON "BlockedUser"("blockerId", "blockedId");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedUser" ADD CONSTRAINT "BlockedUser_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedUser" ADD CONSTRAINT "BlockedUser_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
