-- CreateTable
CREATE TABLE `specializedSubjects` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NULL,
    `trackId` INTEGER NULL,
    `strandId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `appliedSubjects` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NULL,
    `trackId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coreSubjects` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `specializedSubjects` ADD CONSTRAINT `specializedSubjects_strandId_fkey` FOREIGN KEY (`strandId`) REFERENCES `strand`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `specializedSubjects` ADD CONSTRAINT `specializedSubjects_trackId_fkey` FOREIGN KEY (`trackId`) REFERENCES `track`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appliedSubjects` ADD CONSTRAINT `appliedSubjects_trackId_fkey` FOREIGN KEY (`trackId`) REFERENCES `track`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
