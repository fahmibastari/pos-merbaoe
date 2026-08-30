-- AlterTable
ALTER TABLE "users" ADD COLUMN     "session_version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "login_attempts" (
    "username" VARCHAR(50) NOT NULL,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "window_started_at" TIMESTAMPTZ(3) NOT NULL,
    "blocked_until" TIMESTAMPTZ(3),
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("username")
);

-- CreateIndex
CREATE INDEX "login_attempts_updated_at_idx" ON "login_attempts"("updated_at");
