CREATE TABLE "FaultReport" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'a_faire',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaultReport_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FaultReport_statut_check" CHECK ("statut" IN ('a_faire', 'en_cours', 'termine'))
);

CREATE INDEX "FaultReport_userId_idx" ON "FaultReport"("userId");
CREATE INDEX "FaultReport_productId_idx" ON "FaultReport"("productId");

ALTER TABLE "FaultReport"
ADD CONSTRAINT "FaultReport_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FaultReport"
ADD CONSTRAINT "FaultReport_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;