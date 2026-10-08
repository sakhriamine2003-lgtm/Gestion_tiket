ALTER TABLE "Ticket"
ADD COLUMN "userId" INTEGER;

CREATE INDEX "Ticket_userId_idx" ON "Ticket"("userId");

ALTER TABLE "Ticket"
ADD CONSTRAINT "Ticket_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "TicketAttachment" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketAttachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TicketAttachment_ticketId_idx" ON "TicketAttachment"("ticketId");

ALTER TABLE "TicketAttachment"
ADD CONSTRAINT "TicketAttachment_ticketId_fkey"
FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
