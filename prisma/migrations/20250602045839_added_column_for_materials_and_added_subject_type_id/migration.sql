-- AlterTable
ALTER TABLE `materials` ADD COLUMN `subjectTypeId` INTEGER NULL;

-- CreateTable
CREATE TABLE `subjectType` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `materials` ADD CONSTRAINT `materials_subjectTypeId_fkey` FOREIGN KEY (`subjectTypeId`) REFERENCES `subjectType`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
