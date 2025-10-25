/*
  Warnings:

  - You are about to drop the column `endCity` on the `Route` table. All the data in the column will be lost.
  - You are about to drop the column `startCity` on the `Route` table. All the data in the column will be lost.
  - Made the column `startLat` on table `Route` required. This step will fail if there are existing NULL values in that column.
  - Made the column `startLon` on table `Route` required. This step will fail if there are existing NULL values in that column.
  - Made the column `endLat` on table `Route` required. This step will fail if there are existing NULL values in that column.
  - Made the column `endLon` on table `Route` required. This step will fail if there are existing NULL values in that column.

*/

-- AlterTable
ALTER TABLE "Route" DROP COLUMN IF EXISTS "endCity",
DROP COLUMN IF EXISTS "startCity",
ALTER COLUMN "startLat" SET NOT NULL,
ALTER COLUMN "startLon" SET NOT NULL,
ALTER COLUMN "endLat" SET NOT NULL,
ALTER COLUMN "endLon" SET NOT NULL;