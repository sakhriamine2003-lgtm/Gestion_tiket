ALTER TABLE "Product"
ADD COLUMN "initialStock" INTEGER NOT NULL DEFAULT 0;

UPDATE "Product" AS product
SET "initialStock" = product."stock" + (
    SELECT COUNT(*)::INTEGER
    FROM "EquipmentRequest" AS request
    WHERE request."productId" = product."id"
      AND request."status" = 'Acceptée'
);