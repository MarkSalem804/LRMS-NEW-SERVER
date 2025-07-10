-- AlterTable
ALTER TABLE `user` ADD COLUMN `otpCode` VARCHAR(191) NULL,
    ADD COLUMN `otpExpiry` DATETIME(3) NULL;
