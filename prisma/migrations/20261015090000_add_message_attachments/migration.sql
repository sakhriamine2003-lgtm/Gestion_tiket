ALTER TABLE "TicketAttachment"
ADD COLUMN "messageId" INTEGER;

CREATE INDEX "TicketAttachment_messageId_idx" ON "TicketAttachment"("messageId");

ALTER TABLE "TicketAttachment"
ADD CONSTRAINT "TicketAttachment_messageId_fkey"
FOREIGN KEY ("messageId") REFERENCES "ticket_messages"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
