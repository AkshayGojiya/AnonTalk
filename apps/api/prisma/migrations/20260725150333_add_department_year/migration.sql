/*
  Warnings:

  - The `department` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Department" AS ENUM ('CIVIL', 'STRUCTURE', 'COMPUTER', 'ELECTRONICS', 'ELECTRICAL', 'MECHANICAL', 'PRODUCTION', 'ELECTRONICS_AND_COMMUNICATION', 'INFORMATION_TECHNOLOGY', 'MATHEMATICS');

-- CreateEnum
CREATE TYPE "Year" AS ENUM ('YEAR_1', 'YEAR_2', 'YEAR_3', 'YEAR_4');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "year" "Year",
DROP COLUMN "department",
ADD COLUMN     "department" "Department";
