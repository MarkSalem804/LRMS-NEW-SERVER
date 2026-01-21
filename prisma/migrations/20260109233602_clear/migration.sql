-- CreateTable
CREATE TABLE `materialRatings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `materialId` INTEGER NOT NULL,
    `userId` INTEGER NULL,
    `rating` INTEGER NOT NULL,
    `suggestions` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `materialRatings_materialId_userId_key`(`materialId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `materialRatings` ADD CONSTRAINT `materialRatings_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `materials`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `materialRatings` ADD CONSTRAINT `materialRatings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
