CREATE TABLE "ticket_messages" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "senderId" INTEGER,
    "senderRole" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ticket_messages_ticketId_createdAt_idx" ON "ticket_messages"("ticketId", "createdAt");

ALTER TABLE "ticket_messages"
ADD CONSTRAINT "ticket_messages_ticketId_fkey"
FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ticket_messages"
ADD CONSTRAINT "ticket_messages_senderId_fkey"
FOREIGN KEY ("senderId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
