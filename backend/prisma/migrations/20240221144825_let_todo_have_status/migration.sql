-- CreateEnum
CREATE TYPE "Status" AS ENUM ('DONE', 'TODO');

-- AlterTable
ALTER TABLE "Todo" ADD COLUMN "status" "Status" NOT NULL DEFAULT 'TODO';
