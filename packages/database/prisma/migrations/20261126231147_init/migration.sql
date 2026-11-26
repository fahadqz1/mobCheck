-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'SELLER', 'SHOP_OWNER', 'INSPECTOR', 'SUPPORT', 'OPS_ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "ContactPreference" AS ENUM ('EMAIL', 'WHATSAPP', 'PLATFORM', 'PHONE');

-- CreateEnum
CREATE TYPE "EmailTokenType" AS ENUM ('VERIFY_EMAIL', 'RESET_PASSWORD');

-- CreateEnum
CREATE TYPE "ModelCategory" AS ENUM ('FLAGSHIP', 'MID_RANGE', 'BUDGET');

-- CreateEnum
CREATE TYPE "DeviceOS" AS ENUM ('IOS', 'ANDROID');

-- CreateEnum
CREATE TYPE "PhoneCondition" AS ENUM ('BRAND_NEW', 'LIKE_NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'FOR_PARTS');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('APPROVED', 'NON_PTA', 'UNKNOWN', 'BLOCKED', 'NOT_VERIFIED');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'SOLD', 'REMOVED', 'DRAFT');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('OPEN', 'RESPONDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ShopStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('BUSINESS_LICENSE', 'OWNER_ID', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InspectorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('IPHONE', 'ANDROID');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('AWAITING_PAYMENT', 'PAYMENT_CONFIRMED', 'AWAITING_SHOP_CONFIRMATION', 'BOOKING_ACCEPTED', 'INSPECTOR_ASSIGNED', 'INSPECTION_IN_PROGRESS', 'INSPECTION_SUBMITTED', 'REPORT_UNDER_REVIEW', 'REPORT_DELIVERED', 'REVIEW_WINDOW_OPEN', 'COMPLETED', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED', 'DISPUTE_RAISED');

-- CreateEnum
CREATE TYPE "ChecklistStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CheckResult" AS ENUM ('PASS', 'FAIL', 'NEEDS_ATTENTION', 'NOT_TESTED', 'NOT_VERIFIABLE', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "AnnotationType" AS ENUM ('SCREEN_CRACK', 'FRAME_DENT', 'CAMERA_DAMAGE', 'CHARGING_PORT', 'BACK_GLASS_CRACK', 'BUTTON_ISSUE', 'DISPLAY_LINE', 'OTHER');

-- CreateEnum
CREATE TYPE "AssessmentLevel" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'NEEDS_ATTENTION', 'CRITICAL_ISSUES');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'APPROVED', 'PROCESSING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'SCHEDULED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PUBLISHED', 'FLAGGED', 'REMOVED');

-- CreateEnum
CREATE TYPE "ComplaintCategory" AS ENUM ('FRAUDULENT', 'MISLEADING_INFO', 'POOR_QUALITY', 'INCORRECT_REPORT', 'PAYMENT_ISSUE', 'FAKE_REVIEWS', 'HARASSMENT', 'CANCELLATION', 'OTHER');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ComplaintAction" AS ENUM ('WARNING', 'TEMPORARY_SUSPENSION', 'PERMANENT_BAN', 'NONE');

-- CreateEnum
CREATE TYPE "BanType" AS ENUM ('TEMPORARY_SUSPENSION', 'PERMANENT_BAN');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('SHOP_VERIFY', 'SHOP_SUSPEND', 'SHOP_BAN', 'PAYMENT_REFUND', 'DISPUTE_RESOLVE', 'CONFIG_UPDATE', 'USER_SUSPEND', 'OTHER');

-- CreateEnum
CREATE TYPE "WebhookType" AS ENUM ('PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'REFUND_SUCCESS', 'OTHER');

-- CreateEnum
CREATE TYPE "LogSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SettingType" AS ENUM ('STRING', 'INTEGER', 'BOOLEAN', 'JSON');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "bio" TEXT,
    "preferredContact" "ContactPreference" NOT NULL DEFAULT 'EMAIL',
    "city" TEXT,
    "area" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "zipCode" TEXT,
    "totalListings" INTEGER NOT NULL DEFAULT 0,
    "totalInspections" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DECIMAL(2,1),
    "notificationsEmail" BOOLEAN NOT NULL DEFAULT true,
    "notificationsWhatsapp" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopOwnerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cnic" TEXT,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopOwnerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" "EmailTokenType" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "countryOfOrigin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Model" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "releaseYear" INTEGER,
    "baseStorageGb" INTEGER,
    "baseRamGb" INTEGER,
    "storageOptions" TEXT[],
    "colors" TEXT[],
    "category" "ModelCategory" NOT NULL,
    "os" "DeviceOS" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Model_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhoneListing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shopId" TEXT,
    "brandId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "storageGb" INTEGER,
    "ramGb" INTEGER,
    "color" TEXT,
    "condition" "PhoneCondition" NOT NULL,
    "pricePkr" DECIMAL(10,2) NOT NULL,
    "ptaStatus" "DeviceStatus" NOT NULL DEFAULT 'UNKNOWN',
    "imeiLast4" TEXT,
    "imeiVerified" BOOLEAN NOT NULL DEFAULT false,
    "hasBox" BOOLEAN NOT NULL DEFAULT false,
    "hasCharger" BOOLEAN NOT NULL DEFAULT false,
    "hasAccessories" TEXT[],
    "warrantyInfo" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "locationCity" TEXT NOT NULL,
    "locationArea" TEXT NOT NULL,
    "sellerContactPreference" "ContactPreference" NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "listedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "inquiryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhoneListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingPhoto" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "storageUrl" TEXT,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER,
    "uploadSequence" INTEGER NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingInquiry" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "message" TEXT,
    "status" "InquiryStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "city" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "zipCode" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "email" TEXT NOT NULL,
    "openingHour" TEXT,
    "closingHour" TEXT,
    "weeklyHolidays" TEXT[],
    "status" "ShopStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "businessLicenseUrl" TEXT,
    "ownerIdUrl" TEXT,
    "trialStartsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trialEndsAt" TIMESTAMP(3) NOT NULL DEFAULT now() + interval '30 days',
    "totalInspections" INTEGER NOT NULL DEFAULT 0,
    "completedInspections" INTEGER NOT NULL DEFAULT 0,
    "cancelledInspections" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DECIMAL(2,1),
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopSubscription" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "pricePkr" DECIMAL(8,2) NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "lastPaymentDate" TIMESTAMP(3),
    "lastPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopService" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pricePkr" DECIMAL(8,2) NOT NULL,
    "status" "ServiceStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopDocument" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "rejectedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inspector" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "status" "InspectorStatus" NOT NULL DEFAULT 'ACTIVE',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "totalInspections" INTEGER NOT NULL DEFAULT 0,
    "completedInspections" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DECIMAL(2,1),
    "availableMonday" BOOLEAN NOT NULL DEFAULT true,
    "availableTuesday" BOOLEAN NOT NULL DEFAULT true,
    "availableWednesday" BOOLEAN NOT NULL DEFAULT true,
    "availableThursday" BOOLEAN NOT NULL DEFAULT true,
    "availableFriday" BOOLEAN NOT NULL DEFAULT true,
    "availableSaturday" BOOLEAN NOT NULL DEFAULT true,
    "availableSunday" BOOLEAN NOT NULL DEFAULT false,
    "startTime" TEXT,
    "endTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inspector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionBooking" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "inspectorId" TEXT,
    "brandId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "deviceStorageGb" INTEGER,
    "deviceColor" TEXT,
    "ptaStatus" "DeviceStatus" NOT NULL DEFAULT 'UNKNOWN',
    "deviceType" "DeviceType" NOT NULL,
    "inspectionDate" TIMESTAMP(3) NOT NULL,
    "locationLatitude" DECIMAL(10,8),
    "locationLongitude" DECIMAL(11,8),
    "status" "BookingStatus" NOT NULL DEFAULT 'AWAITING_PAYMENT',
    "inspectionFeePkr" DECIMAL(8,2) NOT NULL,
    "paymentId" TEXT,
    "reportDeliveredAt" TIMESTAMP(3),
    "reviewWindowExpiresAt" TIMESTAMP(3),
    "customerConfirmedAt" TIMESTAMP(3),
    "disputeReason" TEXT,
    "disputeRaisedAt" TIMESTAMP(3),
    "disputeResolvedAt" TIMESTAMP(3),
    "disputeResolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspectionBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionChecklist" (
    "id" TEXT NOT NULL,
    "deviceType" "DeviceType" NOT NULL,
    "category" TEXT NOT NULL,
    "categorySequence" INTEGER NOT NULL,
    "checkName" TEXT NOT NULL,
    "checkSequence" INTEGER NOT NULL,
    "description" TEXT,
    "testInstructions" TEXT,
    "status" "ChecklistStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspectionChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionResult" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "result" "CheckResult" NOT NULL,
    "inspectorNotes" TEXT,
    "evidenceId" TEXT,
    "testedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspectionResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionEvidence" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "storageUrl" TEXT,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER,
    "annotationType" "AnnotationType",
    "annotationText" TEXT,
    "annotationCoordinates" TEXT,
    "photoSequence" INTEGER NOT NULL,
    "takenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InspectionEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionReport" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "qrCodeId" TEXT NOT NULL,
    "overallAssessment" "AssessmentLevel" NOT NULL,
    "assessmentSummary" TEXT,
    "pdfStorageKey" TEXT NOT NULL,
    "pdfStorageUrl" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "verificationRequestedAt" TIMESTAMP(3),
    "verificationCompletedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "supersedesReportId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspectionReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amountPkr" DECIMAL(8,2) NOT NULL,
    "gatewayFeePkr" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "netAmountPkr" DECIMAL(8,2) NOT NULL,
    "gateway" TEXT NOT NULL,
    "gatewayTransactionId" TEXT,
    "gatewayReference" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "webhookReceivedAt" TIMESTAMP(3),
    "webhookVerified" BOOLEAN NOT NULL DEFAULT false,
    "webhookSignatureVerified" BOOLEAN NOT NULL DEFAULT false,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amountPkr" DECIMAL(8,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "gatewayRefundId" TEXT,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutLedger" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "grossInspectionFeePkr" DECIMAL(8,2) NOT NULL,
    "gatewayFeePkr" DECIMAL(8,2) NOT NULL,
    "mobcheckMarginPkr" DECIMAL(8,2) NOT NULL,
    "shopPayoutPkr" DECIMAL(8,2) NOT NULL,
    "paymentConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "paymentConfirmedAt" TIMESTAMP(3),
    "reportDelivered" BOOLEAN NOT NULL DEFAULT false,
    "reportDeliveredAt" TIMESTAMP(3),
    "reviewWindowExpiresAt" TIMESTAMP(3),
    "customerConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "customerConfirmedAt" TIMESTAMP(3),
    "disputeActive" BOOLEAN NOT NULL DEFAULT false,
    "disputeResolved" BOOLEAN NOT NULL DEFAULT false,
    "disputeResolvedAt" TIMESTAMP(3),
    "payoutEligible" BOOLEAN NOT NULL DEFAULT false,
    "payoutEligibleAt" TIMESTAMP(3),
    "payoutStatus" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "payoutDate" TIMESTAMP(3),
    "payoutReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "overallRating" INTEGER NOT NULL,
    "inspectionQuality" INTEGER,
    "professionalism" INTEGER,
    "timeliness" INTEGER,
    "communication" INTEGER,
    "reportAccuracy" INTEGER,
    "reviewText" TEXT,
    "wouldRecommend" BOOLEAN,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "bookingId" TEXT,
    "category" "ComplaintCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "evidenceUrls" TEXT[],
    "status" "ComplaintStatus" NOT NULL DEFAULT 'SUBMITTED',
    "resolution" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "actionTaken" "ComplaintAction" NOT NULL DEFAULT 'NONE',
    "actionTakenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopBan" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "banType" "BanType" NOT NULL,
    "reason" TEXT NOT NULL,
    "bannedById" TEXT NOT NULL,
    "bannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "suspendedUntil" TIMESTAMP(3),
    "appealSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "appealText" TEXT,
    "appealSubmittedAt" TIMESTAMP(3),
    "appealReviewedAt" TIMESTAMP(3),
    "appealDecision" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopBan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAction" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "actionType" "ActionType" NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "description" TEXT,
    "changes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookLog" (
    "id" TEXT NOT NULL,
    "webhookType" "WebhookType" NOT NULL,
    "gateway" TEXT NOT NULL,
    "gatewayEventId" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "signature" TEXT,
    "signatureVerified" BOOLEAN NOT NULL DEFAULT false,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "processingError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErrorLog" (
    "id" TEXT NOT NULL,
    "errorType" TEXT NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "stackTrace" TEXT,
    "userId" TEXT,
    "requestId" TEXT,
    "severity" "LogSeverity" NOT NULL DEFAULT 'ERROR',
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErrorLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSetting" (
    "id" TEXT NOT NULL,
    "settingKey" TEXT NOT NULL,
    "settingValue" TEXT NOT NULL,
    "settingType" "SettingType" NOT NULL,
    "description" TEXT,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_userId_key" ON "CustomerProfile"("userId");

-- CreateIndex
CREATE INDEX "CustomerProfile_city_area_idx" ON "CustomerProfile"("city", "area");

-- CreateIndex
CREATE UNIQUE INDEX "ShopOwnerProfile_userId_key" ON "ShopOwnerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "EmailToken_token_key" ON "EmailToken"("token");

-- CreateIndex
CREATE INDEX "EmailToken_userId_type_expiresAt_idx" ON "EmailToken"("userId", "type", "expiresAt");

-- CreateIndex
CREATE INDEX "EmailToken_token_idx" ON "EmailToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

-- CreateIndex
CREATE INDEX "Brand_slug_idx" ON "Brand"("slug");

-- CreateIndex
CREATE INDEX "Model_brandId_slug_idx" ON "Model"("brandId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Model_brandId_slug_key" ON "Model"("brandId", "slug");

-- CreateIndex
CREATE INDEX "PhoneListing_userId_status_idx" ON "PhoneListing"("userId", "status");

-- CreateIndex
CREATE INDEX "PhoneListing_brandId_modelId_idx" ON "PhoneListing"("brandId", "modelId");

-- CreateIndex
CREATE INDEX "PhoneListing_ptaStatus_idx" ON "PhoneListing"("ptaStatus");

-- CreateIndex
CREATE INDEX "PhoneListing_locationCity_locationArea_idx" ON "PhoneListing"("locationCity", "locationArea");

-- CreateIndex
CREATE INDEX "ListingPhoto_listingId_uploadSequence_idx" ON "ListingPhoto"("listingId", "uploadSequence");

-- CreateIndex
CREATE INDEX "ListingInquiry_listingId_status_idx" ON "ListingInquiry"("listingId", "status");

-- CreateIndex
CREATE INDEX "ListingInquiry_customerId_idx" ON "ListingInquiry"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Shop_slug_key" ON "Shop"("slug");

-- CreateIndex
CREATE INDEX "Shop_ownerId_idx" ON "Shop"("ownerId");

-- CreateIndex
CREATE INDEX "Shop_slug_idx" ON "Shop"("slug");

-- CreateIndex
CREATE INDEX "Shop_city_area_status_idx" ON "Shop"("city", "area", "status");

-- CreateIndex
CREATE INDEX "Shop_status_idx" ON "Shop"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ShopSubscription_shopId_key" ON "ShopSubscription"("shopId");

-- CreateIndex
CREATE INDEX "ShopSubscription_shopId_status_idx" ON "ShopSubscription"("shopId", "status");

-- CreateIndex
CREATE INDEX "ShopSubscription_currentPeriodEnd_idx" ON "ShopSubscription"("currentPeriodEnd");

-- CreateIndex
CREATE INDEX "ShopService_shopId_status_idx" ON "ShopService"("shopId", "status");

-- CreateIndex
CREATE INDEX "ShopDocument_shopId_status_idx" ON "ShopDocument"("shopId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Inspector_userId_key" ON "Inspector"("userId");

-- CreateIndex
CREATE INDEX "Inspector_shopId_status_idx" ON "Inspector"("shopId", "status");

-- CreateIndex
CREATE INDEX "InspectionBooking_customerId_status_idx" ON "InspectionBooking"("customerId", "status");

-- CreateIndex
CREATE INDEX "InspectionBooking_shopId_status_idx" ON "InspectionBooking"("shopId", "status");

-- CreateIndex
CREATE INDEX "InspectionBooking_inspectorId_idx" ON "InspectionBooking"("inspectorId");

-- CreateIndex
CREATE INDEX "InspectionBooking_status_idx" ON "InspectionBooking"("status");

-- CreateIndex
CREATE INDEX "InspectionBooking_reviewWindowExpiresAt_idx" ON "InspectionBooking"("reviewWindowExpiresAt");

-- CreateIndex
CREATE INDEX "InspectionChecklist_deviceType_category_idx" ON "InspectionChecklist"("deviceType", "category");

-- CreateIndex
CREATE UNIQUE INDEX "InspectionChecklist_deviceType_category_checkSequence_key" ON "InspectionChecklist"("deviceType", "category", "checkSequence");

-- CreateIndex
CREATE INDEX "InspectionResult_bookingId_idx" ON "InspectionResult"("bookingId");

-- CreateIndex
CREATE INDEX "InspectionEvidence_bookingId_photoSequence_idx" ON "InspectionEvidence"("bookingId", "photoSequence");

-- CreateIndex
CREATE UNIQUE INDEX "InspectionReport_bookingId_key" ON "InspectionReport"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "InspectionReport_reportNumber_key" ON "InspectionReport"("reportNumber");

-- CreateIndex
CREATE UNIQUE INDEX "InspectionReport_qrCodeId_key" ON "InspectionReport"("qrCodeId");

-- CreateIndex
CREATE UNIQUE INDEX "InspectionReport_supersedesReportId_key" ON "InspectionReport"("supersedesReportId");

-- CreateIndex
CREATE INDEX "InspectionReport_bookingId_idx" ON "InspectionReport"("bookingId");

-- CreateIndex
CREATE INDEX "InspectionReport_reportNumber_idx" ON "InspectionReport"("reportNumber");

-- CreateIndex
CREATE INDEX "InspectionReport_qrCodeId_idx" ON "InspectionReport"("qrCodeId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_bookingId_key" ON "Payment"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_gatewayTransactionId_key" ON "Payment"("gatewayTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Payment_customerId_status_idx" ON "Payment"("customerId", "status");

-- CreateIndex
CREATE INDEX "Payment_bookingId_idx" ON "Payment"("bookingId");

-- CreateIndex
CREATE INDEX "Payment_gatewayTransactionId_idx" ON "Payment"("gatewayTransactionId");

-- CreateIndex
CREATE INDEX "Payment_idempotencyKey_idx" ON "Payment"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_gatewayRefundId_key" ON "Refund"("gatewayRefundId");

-- CreateIndex
CREATE INDEX "Refund_paymentId_idx" ON "Refund"("paymentId");

-- CreateIndex
CREATE INDEX "Refund_bookingId_status_idx" ON "Refund"("bookingId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PayoutLedger_bookingId_key" ON "PayoutLedger"("bookingId");

-- CreateIndex
CREATE INDEX "PayoutLedger_shopId_payoutStatus_idx" ON "PayoutLedger"("shopId", "payoutStatus");

-- CreateIndex
CREATE INDEX "PayoutLedger_payoutEligibleAt_idx" ON "PayoutLedger"("payoutEligibleAt");

-- CreateIndex
CREATE INDEX "PayoutLedger_payoutDate_idx" ON "PayoutLedger"("payoutDate");

-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_key" ON "Review"("bookingId");

-- CreateIndex
CREATE INDEX "Review_shopId_status_idx" ON "Review"("shopId", "status");

-- CreateIndex
CREATE INDEX "Review_customerId_idx" ON "Review"("customerId");

-- CreateIndex
CREATE INDEX "Review_bookingId_idx" ON "Review"("bookingId");

-- CreateIndex
CREATE INDEX "Complaint_shopId_status_idx" ON "Complaint"("shopId", "status");

-- CreateIndex
CREATE INDEX "Complaint_customerId_status_idx" ON "Complaint"("customerId", "status");

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "Complaint"("status");

-- CreateIndex
CREATE INDEX "ShopBan_shopId_banType_idx" ON "ShopBan"("shopId", "banType");

-- CreateIndex
CREATE INDEX "AdminAction_adminId_createdAt_idx" ON "AdminAction"("adminId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAction_actionType_idx" ON "AdminAction"("actionType");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookLog_gatewayEventId_key" ON "WebhookLog"("gatewayEventId");

-- CreateIndex
CREATE INDEX "WebhookLog_gatewayEventId_idx" ON "WebhookLog"("gatewayEventId");

-- CreateIndex
CREATE INDEX "WebhookLog_webhookType_processed_idx" ON "WebhookLog"("webhookType", "processed");

-- CreateIndex
CREATE INDEX "ErrorLog_severity_createdAt_idx" ON "ErrorLog"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "ErrorLog_errorType_idx" ON "ErrorLog"("errorType");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSetting_settingKey_key" ON "PlatformSetting"("settingKey");

-- CreateIndex
CREATE INDEX "PlatformSetting_settingKey_idx" ON "PlatformSetting"("settingKey");

-- AddForeignKey
ALTER TABLE "CustomerProfile" ADD CONSTRAINT "CustomerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopOwnerProfile" ADD CONSTRAINT "ShopOwnerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailToken" ADD CONSTRAINT "EmailToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Model" ADD CONSTRAINT "Model_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhoneListing" ADD CONSTRAINT "PhoneListing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhoneListing" ADD CONSTRAINT "PhoneListing_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhoneListing" ADD CONSTRAINT "PhoneListing_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhoneListing" ADD CONSTRAINT "PhoneListing_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPhoto" ADD CONSTRAINT "ListingPhoto_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "PhoneListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingInquiry" ADD CONSTRAINT "ListingInquiry_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "PhoneListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingInquiry" ADD CONSTRAINT "ListingInquiry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopSubscription" ADD CONSTRAINT "ShopSubscription_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopSubscription" ADD CONSTRAINT "ShopSubscription_lastPaymentId_fkey" FOREIGN KEY ("lastPaymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopService" ADD CONSTRAINT "ShopService_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopDocument" ADD CONSTRAINT "ShopDocument_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspector" ADD CONSTRAINT "Inspector_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspector" ADD CONSTRAINT "Inspector_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspector" ADD CONSTRAINT "Inspector_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionBooking" ADD CONSTRAINT "InspectionBooking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionBooking" ADD CONSTRAINT "InspectionBooking_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionBooking" ADD CONSTRAINT "InspectionBooking_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "Inspector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionBooking" ADD CONSTRAINT "InspectionBooking_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionBooking" ADD CONSTRAINT "InspectionBooking_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionResult" ADD CONSTRAINT "InspectionResult_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "InspectionBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionResult" ADD CONSTRAINT "InspectionResult_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "InspectionChecklist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionResult" ADD CONSTRAINT "InspectionResult_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "InspectionEvidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionEvidence" ADD CONSTRAINT "InspectionEvidence_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "InspectionBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionReport" ADD CONSTRAINT "InspectionReport_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "InspectionBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionReport" ADD CONSTRAINT "InspectionReport_supersedesReportId_fkey" FOREIGN KEY ("supersedesReportId") REFERENCES "InspectionReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "InspectionBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "InspectionBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutLedger" ADD CONSTRAINT "PayoutLedger_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutLedger" ADD CONSTRAINT "PayoutLedger_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "InspectionBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "InspectionBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "InspectionBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopBan" ADD CONSTRAINT "ShopBan_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopBan" ADD CONSTRAINT "ShopBan_bannedById_fkey" FOREIGN KEY ("bannedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAction" ADD CONSTRAINT "AdminAction_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
