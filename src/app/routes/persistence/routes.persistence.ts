import prisma from "../../../lib/prisma";
import { CreateRoute, UpdateRoute } from "../../../models/route.model";

export const RouteRepository = {
    getAll: () => prisma.route.findMany(),
    getById: (id: string) => prisma.route.findUnique({ where: { id } }),
    create: (data: CreateRoute & { distanceKm: number }) => prisma.route.create({ data }),
    update: (id: string, data: UpdateRoute) =>
        prisma.route.update({ where: { id }, data }),
    remove: (id: string) => prisma.route.delete({ where: { id } }),
};