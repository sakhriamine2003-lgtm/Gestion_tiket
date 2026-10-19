ALTER TABLE "EquipmentRequest" DROP CONSTRAINT "EquipmentRequest_equipmentId_fkey";

DROP INDEX "EquipmentRequest_equipmentId_idx";

ALTER TABLE "EquipmentRequest" DROP COLUMN "equipmentId";

DROP TABLE "Equipment";
