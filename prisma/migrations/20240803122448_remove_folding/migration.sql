/*
  Warnings:

  - You are about to drop the `FoldedProof` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FoldedProof" DROP CONSTRAINT "FoldedProof_userId_fkey";

-- DropTable
DROP TABLE "FoldedProof";
