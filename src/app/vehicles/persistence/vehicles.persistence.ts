import prisma from "../../../lib/prisma";
import { Vehicle } from "../../../models/vehicle.model";

export const VehicleRepository = {
    getAll: () => prisma.vehicle.findMany(),
    getById: (id: string) => prisma.vehicle.findUnique({ where: { id } }),
    create: (data: Vehicle) => prisma.vehicle.create({ data }),
    update: (id: string, data: Partial<Vehicle>) =>
        prisma.vehicle.update({ where: { id }, data }),
    remove: (id: string) => prisma.vehicle.delete({ where: { id } }),
};