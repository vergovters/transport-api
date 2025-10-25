import { CreateRouteSchema, UpdateRouteSchema } from "../../../models/route.model";
import { RouteRepository } from "../persistence/routes.persistence";
import { getDistanceKm } from "../../../lib/osrm";
import { RouteStateMachineService } from "../services/routeStateMachine.service";

export const RouteActions = {
    async list() {
        return RouteRepository.getAll();
    },

    async create(data: unknown) {
        const parsed = CreateRouteSchema.parse(data);

        const distanceKm = await getDistanceKm(
            parsed.startLon,
            parsed.startLat,
            parsed.endLon,
            parsed.endLat
        );

        return RouteRepository.create({
            ...parsed,
            distanceKm,
        });
    },

    async update(id: string, data: unknown) {
        const parsed = UpdateRouteSchema.parse(data);

        let distanceKm: number | undefined;
        if (parsed.startLat && parsed.startLon && parsed.endLat && parsed.endLon) {
            distanceKm = await getDistanceKm(
                parsed.startLon,
                parsed.startLat,
                parsed.endLon,
                parsed.endLat
            );
        }

        return RouteRepository.update(id, { ...parsed, distanceKm });
    },

    async assignVehicle(routeId: string, vehicleId: string) {
        return RouteStateMachineService.assignVehicle(routeId, vehicleId);
    },

    async startRoute(routeId: string, departureDate?: Date) {
        return RouteStateMachineService.startRoute(routeId, departureDate);
    },

    async completeRoute(routeId: string, completionDate?: Date) {
        return RouteStateMachineService.completeRoute(routeId, completionDate);
    },

    async cancelRoute(routeId: string, reason?: string) {
        return RouteStateMachineService.cancelRoute(routeId, reason);
    },

    async retryRoute(routeId: string) {
        return RouteStateMachineService.retryRoute(routeId);
    },

    async getValidTransitions(routeId: string) {
        return RouteStateMachineService.getValidTransitions(routeId);
    },

    async remove(id: string) {
        return RouteRepository.remove(id);
    },
};
