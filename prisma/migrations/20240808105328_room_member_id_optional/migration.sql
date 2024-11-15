-- DropForeignKey
ALTER TABLE "RoomMember" DROP CONSTRAINT "RoomMember_userId_fkey";

-- AlterTable
ALTER TABLE "RoomMember" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "RoomMember" ADD CONSTRAINT "RoomMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
