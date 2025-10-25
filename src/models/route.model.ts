import { z } from "zod";
import { VehicleTypeEnum, RouteStatusEnum, VehicleType, RouteStatus } from "./enums";

export const RouteSchema = z.object({
    id: z.string().uuid().optional(),
    startLat: z.number().min(-90).max(90),
    startLon: z.number().min(-180).max(180),
    endLat: z.number().min(-90).max(90),
    endLon: z.number().min(-180).max(180),
    distanceKm: z.number().positive(),
    departureDate: z.date().or(z.string().datetime()),
    completionDate: z.date().or(z.string().datetime()).nullable().optional(),
    requiredVehicleType: VehicleTypeEnum,
    expectedRevenueUsd: z.number().positive().optional(),
    vehicleId: z.string().uuid().nullable().optional(),
    status: RouteStatusEnum.default("PENDING"),
    costEur: z.number().positive().optional(),
    costUsd: z.number().positive().optional(),
    costUah: z.number().positive().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

export const CreateRouteSchema = RouteSchema.omit({ id: true, createdAt: true, updatedAt: true, distanceKm: true });
export const UpdateRouteSchema = RouteSchema.partial().omit({ id: true, createdAt: true, updatedAt: true });

export type Route = z.infer<typeof RouteSchema>;
export type CreateRoute = z.infer<typeof CreateRouteSchema>;
export type UpdateRoute = z.infer<typeof UpdateRouteSchema>;
export { RouteStatus, VehicleType };