/*
  Warnings:

  - You are about to alter the column `role` on the `profile` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(1))`.
  - You are about to alter the column `role` on the `user` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(1))`.

*/
-- AlterTable
ALTER TABLE `profile` MODIFY `role` ENUM('Administrative', 'Teacher', 'EPS', 'LR_coor', 'Non_teaching') NOT NULL;

-- AlterTable
ALTER TABLE `user` MODIFY `role` ENUM('Administrative', 'Teacher', 'EPS', 'LR_coor', 'Non_teaching') NOT NULL;
