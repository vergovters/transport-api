/*
  Warnings:

  - The `requiredVehicleType` column on the `Route` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Route` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Vehicle` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `type` column on the `Vehicle` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('TRUCK', 'CAR', 'VAN', 'BUS', 'MOTORCYCLE');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('FREE', 'BUSY', 'MAINTENANCE', 'OUT_OF_ORDER');

-- CreateEnum
CREATE TYPE "RouteStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Route" DROP COLUMN "requiredVehicleType",
ADD COLUMN     "requiredVehicleType" "VehicleType" NOT NULL;

-- AlterTable
ALTER TABLE "Route" DROP COLUMN "status",
ADD COLUMN     "status" "RouteStatus" NOT NULL;

-- AlterTable
ALTER TABLE "Vehicle" DROP COLUMN "status",
ADD COLUMN     "status" "VehicleStatus" NOT NULL;

-- AlterTable
ALTER TABLE "Vehicle" DROP COLUMN "type",
ADD COLUMN     "type" "VehicleType" NOT NULL;