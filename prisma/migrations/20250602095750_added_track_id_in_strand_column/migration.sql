/*
  Warnings:

  - You are about to drop the column `description` on the `strand` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `strand` DROP COLUMN `description`,
    ADD COLUMN `trackId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `strand` ADD CONSTRAINT `strand_trackId_fkey` FOREIGN KEY (`trackId`) REFERENCES `track`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
