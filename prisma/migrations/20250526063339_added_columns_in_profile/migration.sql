/*
  Warnings:

  - Made the column `role` on table `profile` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `profile` MODIFY `role` VARCHAR(191) NOT NULL;
