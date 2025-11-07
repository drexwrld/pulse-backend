-- AlterTable
ALTER TABLE "classes" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "darkModeEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "studentId" TEXT;
