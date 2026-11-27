-- Rollback for migration 20261127000000_listing_details_shop_branding_reports_notifications.
-- Removes only what that migration added. Data entered into these new columns/tables is lost.
-- Take a backup first. Run inside a transaction:
--   BEGIN; \i rollback-20261127000000.sql; COMMIT;

DROP TABLE IF EXISTS "Notification";
DROP TABLE IF EXISTS "ListingReport";
DROP TYPE IF EXISTS "ListingReportStatus";
DROP TYPE IF EXISTS "ListingReportReason";

ALTER TABLE "Shop"
  DROP COLUMN IF EXISTS "logoUrl",
  DROP COLUMN IF EXISTS "coverUrl",
  DROP COLUMN IF EXISTS "galleryUrls";

ALTER TABLE "PhoneListing"
  DROP COLUMN IF EXISTS "batteryHealth",
  DROP COLUMN IF EXISTS "repairHistory";

DELETE FROM "_prisma_migrations"
WHERE "migration_name" = '20261127000000_listing_details_shop_branding_reports_notifications';
