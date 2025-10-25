import { createActor } from 'xstate';
import { routeMachine, mapStateToRouteStatus, mapRouteStatusToState } from '../../../lib/routeStateMachine';
import { RouteRepository } from '../persistence/routes.persistence';
import { VehicleRepository } from '../../vehicles/persistence/vehicles.persistence';
import { RouteStatus } from '../../../models/enums';
import { CurrencyService } from '../../../lib/currency';

export class RouteStateMachineService {

    static async initializeRouteMachine(routeId: string) {
        const route = await RouteRepository.getById(routeId);
        if (!route) {
            throw new Error(`Route with id ${routeId} not found`);
        }

        const actor = createActor(routeMachine, {
            input: {
                routeId: route.id,
                vehicleId: route.vehicleId || undefined,
                departureDate: route.departureDate || undefined,
                completionDate: route.completionDate || undefined,
            }
        });

        actor.start();

        const currentStatus = route.status as RouteStatus;

        if (currentStatus === 'PENDING' && route.vehicleId) {
            actor.send({ type: 'ASSIGN_VEHICLE', vehicleId: route.vehicleId });
        }

        if (currentStatus === 'IN_PROGRESS') {
            if (route.vehicleId) {
                actor.send({ type: 'ASSIGN_VEHICLE', vehicleId: route.vehicleId });
            }
            actor.send({ type: 'START_ROUTE', departureDate: route.departureDate });
        }

        return { actor, route };
    }

    static async assignVehicle(routeId: string, vehicleId: string) {
        const { actor, route } = await this.initializeRouteMachine(routeId);

        if (!actor.getSnapshot().can({ type: 'ASSIGN_VEHICLE', vehicleId })) {
            throw new Error(`Cannot assign vehicle to route in ${route.status} status`);
        }

        const vehicle = await VehicleRepository.getById(vehicleId);
        if (!vehicle) {
            throw new Error(`Vehicle with id ${vehicleId} not found`);
        }

        if (vehicle.status !== 'FREE') {
            throw new Error(`Vehicle ${vehicle.plateNumber} is not available (status: ${vehicle.status})`);
        }

        const costs = await CurrencyService.calculateRouteCost(
            route.distanceKm,
            vehicle.pricePerKmEur
        );

        actor.send({ type: 'ASSIGN_VEHICLE', vehicleId });

        const newSnapshot = actor.getSnapshot();
        const newStatus = mapStateToRouteStatus(newSnapshot.value as string);

        const updatedRoute = await RouteRepository.update(routeId, {
            vehicleId,
            status: newStatus,
            costEur: costs.eur,
            costUsd: costs.usd,
            costUah: costs.uah,
        });

        await VehicleRepository.update(vehicleId, {
            status: 'BUSY',
            currentRouteId: routeId
        });

        actor.stop();
        return updatedRoute;
    }

    static async startRoute(routeId: string, departureDate?: Date) {
        const { actor, route } = await this.initializeRouteMachine(routeId);

        if (!actor.getSnapshot().can({ type: 'START_ROUTE', departureDate })) {
            throw new Error(`Cannot start route in ${route.status} status`);
        }

        actor.send({ type: 'START_ROUTE', departureDate });

        const newSnapshot = actor.getSnapshot();
        const newStatus = mapStateToRouteStatus(newSnapshot.value as string);

        const updatedRoute = await RouteRepository.update(routeId, {
            status: newStatus,
            departureDate: departureDate || new Date(),
        });

        actor.stop();
        return updatedRoute;
    }

    static async completeRoute(routeId: string, completionDate?: Date) {
        const { actor, route } = await this.initializeRouteMachine(routeId);

        const currentSnapshot = actor.getSnapshot();
        const currentState = currentSnapshot.value as string;


        const canComplete = currentSnapshot.can({ type: 'COMPLETE_ROUTE', completionDate });

        if (!canComplete) {
            const errorMsg = `Cannot complete route: current status in DB is "${route.status}", machine state is "${currentState}". Route must be in IN_PROGRESS status to be completed.`;
            throw new Error(errorMsg);
        }

        actor.send({ type: 'COMPLETE_ROUTE', completionDate });

        const newSnapshot = actor.getSnapshot();
        const newStatus = mapStateToRouteStatus(newSnapshot.value as string);

        const updatedRoute = await RouteRepository.update(routeId, {
            status: newStatus,
            completionDate: completionDate || new Date(),
        });

        if (route.vehicleId) {
            await VehicleRepository.update(route.vehicleId, {
                status: 'FREE',
                currentRouteId: null
            });
        }

        actor.stop();
        return updatedRoute;
    }

    static async cancelRoute(routeId: string, reason?: string) {
        const { actor, route } = await this.initializeRouteMachine(routeId);

        if (!actor.getSnapshot().can({ type: 'CANCEL_ROUTE', reason })) {
            throw new Error(`Cannot cancel route in ${route.status} status`);
        }

        actor.send({ type: 'CANCEL_ROUTE', reason });

        const newSnapshot = actor.getSnapshot();
        const newStatus = mapStateToRouteStatus(newSnapshot.value as string);

        const updatedRoute = await RouteRepository.update(routeId, {
            status: newStatus,
        });

        if (route.vehicleId) {
            await VehicleRepository.update(route.vehicleId, {
                status: 'FREE',
                currentRouteId: null
            });
        }

        actor.stop();
        return updatedRoute;
    }

    static async retryRoute(routeId: string) {
        const { actor, route } = await this.initializeRouteMachine(routeId);

        if (!actor.getSnapshot().can({ type: 'RETRY' })) {
            throw new Error(`Cannot retry route in ${route.status} status`);
        }

        actor.send({ type: 'RETRY' });

        const newSnapshot = actor.getSnapshot();
        const newStatus = mapStateToRouteStatus(newSnapshot.value as string);

        const updatedRoute = await RouteRepository.update(routeId, {
            status: newStatus,
            vehicleId: null,
            completionDate: null,
            costEur: undefined,
            costUsd: undefined,
            costUah: undefined,
        });

        actor.stop();
        return updatedRoute;
    }

    static async getValidTransitions(routeId: string) {
        const { actor } = await this.initializeRouteMachine(routeId);

        const snapshot = actor.getSnapshot();
        const validTransitions = [];

        if (snapshot.can({ type: 'ASSIGN_VEHICLE', vehicleId: 'test' })) {
            validTransitions.push('ASSIGN_VEHICLE');
        }
        if (snapshot.can({ type: 'START_ROUTE' })) {
            validTransitions.push('START_ROUTE');
        }
        if (snapshot.can({ type: 'COMPLETE_ROUTE' })) {
            validTransitions.push('COMPLETE_ROUTE');
        }
        if (snapshot.can({ type: 'CANCEL_ROUTE' })) {
            validTransitions.push('CANCEL_ROUTE');
        }
        if (snapshot.can({ type: 'RETRY' })) {
            validTransitions.push('RETRY');
        }

        actor.stop();
        return validTransitions;
    }
}