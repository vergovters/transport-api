import { z } from "zod";
import { VehicleTypeEnum, VehicleStatusEnum, VehicleType, VehicleStatus } from "./enums";

export const VehicleSchema = z.object({
    id: z.string().uuid().optional(),
    plateNumber: z.string().min(2),
    model: z.string().min(2),
    type: VehicleTypeEnum,
    purchaseDate: z.date().or(z.string().datetime()),
    status: VehicleStatusEnum,
    pricePerKmEur: z.number().positive(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    currentRouteId: z.string().uuid().nullable().optional(),
});

export const CreateVehicleSchema = VehicleSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const UpdateVehicleSchema = VehicleSchema.partial().omit({ id: true, createdAt: true, updatedAt: true });

export type Vehicle = z.infer<typeof VehicleSchema>;
export type CreateVehicle = z.infer<typeof CreateVehicleSchema>;
export type UpdateVehicle = z.infer<typeof UpdateVehicleSchema>;
export { VehicleType, VehicleStatus };