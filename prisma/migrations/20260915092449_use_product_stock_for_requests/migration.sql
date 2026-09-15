/*
  Warnings:

  - Added the required column `productId` to the `EquipmentRequest` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "EquipmentRequest" DROP CONSTRAINT "EquipmentRequest_equipmentId_fkey";

-- AlterTable
ALTER TABLE "EquipmentRequest" ADD COLUMN     "productId" INTEGER NOT NULL,
ALTER COLUMN "equipmentId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "EquipmentRequest_productId_idx" ON "EquipmentRequest"("productId");

-- AddForeignKey
ALTER TABLE "EquipmentRequest" ADD CONSTRAINT "EquipmentRequest_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentRequest" ADD CONSTRAINT "EquipmentRequest_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
