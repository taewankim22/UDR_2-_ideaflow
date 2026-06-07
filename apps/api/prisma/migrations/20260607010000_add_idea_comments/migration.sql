CREATE TABLE "idea_comments" (
    "id" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idea_comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idea_comments_ideaId_createdAt_idx" ON "idea_comments"("ideaId", "createdAt");
CREATE INDEX "idea_comments_authorId_createdAt_idx" ON "idea_comments"("authorId", "createdAt");

ALTER TABLE "idea_comments"
ADD CONSTRAINT "idea_comments_ideaId_fkey"
FOREIGN KEY ("ideaId") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "idea_comments"
ADD CONSTRAINT "idea_comments_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
