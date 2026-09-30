-- Keep the description supplied by a user when reporting an equipment failure.
ALTER TABLE "EquipmentRequest" ADD COLUMN "reason" TEXT;
