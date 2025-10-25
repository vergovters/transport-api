import { z } from "zod";

export const VehicleTypeEnum = z.enum([
    "TRUCK",
    "CAR",
    "VAN",
    "BUS",
    "MOTORCYCLE"
]);

export const VehicleStatusEnum = z.enum([
    "FREE",
    "BUSY",
    "MAINTENANCE",
    "OUT_OF_ORDER"
]);

export const RouteStatusEnum = z.enum([
    "PENDING",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED"
]);

export type VehicleType = z.infer<typeof VehicleTypeEnum>;
export type VehicleStatus = z.infer<typeof VehicleStatusEnum>;
export type RouteStatus = z.infer<typeof RouteStatusEnum>;

export const VEHICLE_TYPES = VehicleTypeEnum.options;
export const VEHICLE_STATUSES = VehicleStatusEnum.options;
export const ROUTE_STATUSES = RouteStatusEnum.options;