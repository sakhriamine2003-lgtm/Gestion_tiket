-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN "adminReadAt" TIMESTAMP(3),
ADD COLUMN "userReadAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN "lastSeenAt" TIMESTAMP(3);
