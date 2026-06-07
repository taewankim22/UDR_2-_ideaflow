CREATE TABLE "whiteboard_assistant_messages" (
    "id" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "targetNodeKey" TEXT,
    "suggestion" TEXT,
    "followUps" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whiteboard_assistant_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "whiteboard_assistant_messages_ideaId_createdAt_idx" ON "whiteboard_assistant_messages"("ideaId", "createdAt");

ALTER TABLE "whiteboard_assistant_messages"
ADD CONSTRAINT "whiteboard_assistant_messages_ideaId_fkey"
FOREIGN KEY ("ideaId") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
