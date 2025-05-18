-- DropForeignKey
ALTER TABLE `profile` DROP FOREIGN KEY `profile_userId_fkey`;

-- DropIndex
DROP INDEX `profile_userId_fkey` ON `profile`;

-- AlterTable
ALTER TABLE `profile` MODIFY `userId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `profile` ADD CONSTRAINT `profile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
