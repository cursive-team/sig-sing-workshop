-- DropForeignKey
ALTER TABLE "Room" DROP CONSTRAINT "Room_creatorId_fkey";

-- AlterTable
ALTER TABLE "Room" ALTER COLUMN "creatorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
