import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Route } from '@prisma/client';
import { mock } from 'jest-mock-extended';

const routeRepositoryMock = mock<any>();
const createRouteSchemaMock = mock<any>();
const updateRouteSchemaMock = mock<any>();
const getDistanceKmMock = jest.fn() as any;
const routeStateMachineServiceMock = mock<any>();

jest.mock('../../../../src/app/routes/persistence/routes.persistence', () => ({
    RouteRepository: routeRepositoryMock
}));

jest.mock('../../../../src/models/route.model', () => ({
    CreateRouteSchema: createRouteSchemaMock,
    UpdateRouteSchema: updateRouteSchemaMock,
}));

jest.mock('../../../../src/lib/osrm', () => ({
    getDistanceKm: getDistanceKmMock
}));

jest.mock('../../../../src/app/routes/services/routeStateMachine.service', () => ({
    RouteStateMachineService: routeStateMachineServiceMock
}));

import { RouteActions } from '../../../../src/app/routes/actions/routes.actions';

describe('RouteActions', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('list', () => {
        it('should return all routes', async () => {
            const mockRoutes = [
                {
                    id: '1',
                    startLat: 40.7128,
                    startLon: -74.0060,
                    endLat: 34.0522,
                    endLon: -118.2437,
                    distanceKm: 4445,
                    status: 'PENDING'
                } as Partial<Route>,
                {
                    id: '2',
                    startLat: 51.5074,
                    startLon: -0.1278,
                    endLat: 48.8566,
                    endLon: 2.3522,
                    distanceKm: 344,
                    status: 'IN_PROGRESS'
                } as Partial<Route>
            ] as Route[];

            routeRepositoryMock.getAll.mockResolvedValue(mockRoutes);

            const result = await RouteActions.list();

            expect(routeRepositoryMock.getAll).toHaveBeenCalled();
            expect(result).toEqual(mockRoutes);
        });

        it('should handle repository errors', async () => {
            routeRepositoryMock.getAll.mockRejectedValue(new Error('Database connection failed'));

            await expect(RouteActions.list()).rejects.toThrow('Database connection failed');
            expect(routeRepositoryMock.getAll).toHaveBeenCalled();
        });
    });

    describe('create', () => {
        it('should create a new route with calculated distance', async () => {
            const inputData = {
                startLat: 40.7128,
                startLon: -74.0060,
                endLat: 34.0522,
                endLon: -118.2437,
                departureDate: new Date('2023-12-25T10:00:00Z'),
                requiredVehicleType: 'TRUCK',
                expectedRevenueUsd: 5000
            };

            const parsedData = { ...inputData };
            const calculatedDistance = 4445;
            const createdRoute = {
                id: '123',
                ...parsedData,
                distanceKm: calculatedDistance,
                status: 'PENDING'
            } as Route;

            createRouteSchemaMock.parse.mockReturnValue(parsedData);
            getDistanceKmMock.mockResolvedValue(calculatedDistance);
            routeRepositoryMock.create.mockResolvedValue(createdRoute);

            const result = await RouteActions.create(inputData);

            expect(createRouteSchemaMock.parse).toHaveBeenCalledWith(inputData);
            expect(getDistanceKmMock).toHaveBeenCalledWith(
                parsedData.startLon,
                parsedData.startLat,
                parsedData.endLon,
                parsedData.endLat
            );
            expect(routeRepositoryMock.create).toHaveBeenCalledWith({
                ...parsedData,
                distanceKm: calculatedDistance
            });
            expect(result).toEqual(createdRoute);
        });

        it('should throw validation error for invalid data', async () => {
            const invalidData = {
                startLat: 91,
                startLon: -74.0060,
                endLat: 34.0522,
                endLon: -118.2437
            };

            createRouteSchemaMock.parse.mockImplementation(() => {
                throw new Error('Latitude must be between -90 and 90');
            });

            await expect(RouteActions.create(invalidData)).rejects.toThrow('Latitude must be between -90 and 90');
            expect(createRouteSchemaMock.parse).toHaveBeenCalledWith(invalidData);
            expect(getDistanceKmMock).not.toHaveBeenCalled();
            expect(routeRepositoryMock.create).not.toHaveBeenCalled();
        });

        it('should handle OSRM distance calculation errors', async () => {
            const validData = {
                startLat: 40.7128,
                startLon: -74.0060,
                endLat: 34.0522,
                endLon: -118.2437,
                departureDate: new Date(),
                requiredVehicleType: 'TRUCK'
            };

            createRouteSchemaMock.parse.mockReturnValue(validData);
            getDistanceKmMock.mockRejectedValue(new Error('Failed to calculate distance using OSRM'));

            await expect(RouteActions.create(validData)).rejects.toThrow('Failed to calculate distance using OSRM');
            expect(createRouteSchemaMock.parse).toHaveBeenCalledWith(validData);
            expect(getDistanceKmMock).toHaveBeenCalled();
            expect(routeRepositoryMock.create).not.toHaveBeenCalled();
        });

        it('should handle repository creation errors', async () => {
            const validData = {
                startLat: 40.7128,
                startLon: -74.0060,
                endLat: 34.0522,
                endLon: -118.2437,
                departureDate: new Date(),
                requiredVehicleType: 'TRUCK'
            };

            createRouteSchemaMock.parse.mockReturnValue(validData);
            getDistanceKmMock.mockResolvedValue(100);
            routeRepositoryMock.create.mockRejectedValue(new Error('Database constraint violation'));

            await expect(RouteActions.create(validData)).rejects.toThrow('Database constraint violation');
            expect(routeRepositoryMock.create).toHaveBeenCalled();
        });
    });

    describe('update', () => {
        it('should update route without recalculating distance', async () => {
            const routeId = '123';
            const inputData = {
                departureDate: new Date('2023-12-26T10:00:00Z'),
                expectedRevenueUsd: 6000
            };
            const parsedData = { ...inputData };
            const updatedRoute = {
                id: routeId,
                ...parsedData,
                distanceKm: 4445
            } as Route;

            updateRouteSchemaMock.parse.mockReturnValue(parsedData);
            routeRepositoryMock.update.mockResolvedValue(updatedRoute);

            const result = await RouteActions.update(routeId, inputData);

            expect(updateRouteSchemaMock.parse).toHaveBeenCalledWith(inputData);
            expect(getDistanceKmMock).not.toHaveBeenCalled();
            expect(routeRepositoryMock.update).toHaveBeenCalledWith(routeId, {
                ...parsedData,
                distanceKm: undefined
            });
            expect(result).toEqual(updatedRoute);
        });

        it('should update route and recalculate distance when coordinates change', async () => {
            const routeId = '123';
            const inputData = {
                startLat: 40.7128,
                startLon: -74.0060,
                endLat: 42.3601,
                endLon: -71.0589,
                departureDate: new Date('2023-12-26T10:00:00Z')
            };
            const parsedData = { ...inputData };
            const newDistance = 306;
            const updatedRoute = {
                id: routeId,
                ...parsedData,
                distanceKm: newDistance
            } as Route;

            updateRouteSchemaMock.parse.mockReturnValue(parsedData);
            getDistanceKmMock.mockResolvedValue(newDistance);
            routeRepositoryMock.update.mockResolvedValue(updatedRoute);

            const result = await RouteActions.update(routeId, inputData);

            expect(updateRouteSchemaMock.parse).toHaveBeenCalledWith(inputData);
            expect(getDistanceKmMock).toHaveBeenCalledWith(
                parsedData.startLon,
                parsedData.startLat,
                parsedData.endLon,
                parsedData.endLat
            );
            expect(routeRepositoryMock.update).toHaveBeenCalledWith(routeId, {
                ...parsedData,
                distanceKm: newDistance
            });
            expect(result).toEqual(updatedRoute);
        });

        it('should throw validation error for invalid update data', async () => {
            const routeId = '123';
            const invalidData = {
                startLat: -91
            };

            updateRouteSchemaMock.parse.mockImplementation(() => {
                throw new Error('Latitude must be between -90 and 90');
            });

            await expect(RouteActions.update(routeId, invalidData)).rejects.toThrow('Latitude must be between -90 and 90');
            expect(updateRouteSchemaMock.parse).toHaveBeenCalledWith(invalidData);
            expect(getDistanceKmMock).not.toHaveBeenCalled();
            expect(routeRepositoryMock.update).not.toHaveBeenCalled();
        });

        it('should handle partial coordinate updates (missing some coordinates)', async () => {
            const routeId = '123';
            const inputData = {
                startLat: 40.7128,
                startLon: -74.0060,
                departureDate: new Date()
            };
            const parsedData = { ...inputData };

            updateRouteSchemaMock.parse.mockReturnValue(parsedData);
            routeRepositoryMock.update.mockResolvedValue({ id: routeId } as Route);

            await RouteActions.update(routeId, inputData);

            expect(getDistanceKmMock).not.toHaveBeenCalled();
            expect(routeRepositoryMock.update).toHaveBeenCalledWith(routeId, {
                ...parsedData,
                distanceKm: undefined
            });
        });
    });

    describe('assignVehicle', () => {
        it('should assign vehicle to route using state machine', async () => {
            const routeId = '123';
            const vehicleId = '456';
            const result = { success: true, routeId, vehicleId };

            routeStateMachineServiceMock.assignVehicle.mockResolvedValue(result);

            const response = await RouteActions.assignVehicle(routeId, vehicleId);

            expect(routeStateMachineServiceMock.assignVehicle).toHaveBeenCalledWith(routeId, vehicleId);
            expect(response).toEqual(result);
        });

        it('should handle state machine errors during vehicle assignment', async () => {
            const routeId = '123';
            const vehicleId = '456';

            routeStateMachineServiceMock.assignVehicle.mockRejectedValue(
                new Error('Cannot assign vehicle to route in COMPLETED status')
            );

            await expect(RouteActions.assignVehicle(routeId, vehicleId))
                .rejects.toThrow('Cannot assign vehicle to route in COMPLETED status');
            expect(routeStateMachineServiceMock.assignVehicle).toHaveBeenCalledWith(routeId, vehicleId);
        });
    });

    describe('startRoute', () => {
        it('should start route execution using state machine', async () => {
            const routeId = '123';
            const departureDate = new Date('2023-12-25T10:00:00Z');
            const result = { success: true, routeId, status: 'IN_PROGRESS' };

            routeStateMachineServiceMock.startRoute.mockResolvedValue(result);

            const response = await RouteActions.startRoute(routeId, departureDate);

            expect(routeStateMachineServiceMock.startRoute).toHaveBeenCalledWith(routeId, departureDate);
            expect(response).toEqual(result);
        });

        it('should start route without departure date', async () => {
            const routeId = '123';
            const result = { success: true, routeId, status: 'IN_PROGRESS' };

            routeStateMachineServiceMock.startRoute.mockResolvedValue(result);

            const response = await RouteActions.startRoute(routeId);

            expect(routeStateMachineServiceMock.startRoute).toHaveBeenCalledWith(routeId, undefined);
            expect(response).toEqual(result);
        });

        it('should handle state machine errors during route start', async () => {
            const routeId = '123';

            routeStateMachineServiceMock.startRoute.mockRejectedValue(
                new Error('Cannot start route without assigned vehicle')
            );

            await expect(RouteActions.startRoute(routeId))
                .rejects.toThrow('Cannot start route without assigned vehicle');
        });
    });

    describe('completeRoute', () => {
        it('should complete route and free vehicle using state machine', async () => {
            const routeId = '123';
            const completionDate = new Date('2023-12-25T18:00:00Z');
            const result = { success: true, routeId, status: 'COMPLETED' };

            routeStateMachineServiceMock.completeRoute.mockResolvedValue(result);

            const response = await RouteActions.completeRoute(routeId, completionDate);

            expect(routeStateMachineServiceMock.completeRoute).toHaveBeenCalledWith(routeId, completionDate);
            expect(response).toEqual(result);
        });

        it('should complete route without completion date', async () => {
            const routeId = '123';
            const result = { success: true, routeId, status: 'COMPLETED' };

            routeStateMachineServiceMock.completeRoute.mockResolvedValue(result);

            const response = await RouteActions.completeRoute(routeId);

            expect(routeStateMachineServiceMock.completeRoute).toHaveBeenCalledWith(routeId, undefined);
            expect(response).toEqual(result);
        });

        it('should handle state machine errors during route completion', async () => {
            const routeId = '123';

            routeStateMachineServiceMock.completeRoute.mockRejectedValue(
                new Error('Cannot complete route that is not in progress')
            );

            await expect(RouteActions.completeRoute(routeId))
                .rejects.toThrow('Cannot complete route that is not in progress');
        });
    });

    describe('cancelRoute', () => {
        it('should cancel route with reason using state machine', async () => {
            const routeId = '123';
            const reason = 'Vehicle breakdown';
            const result = { success: true, routeId, status: 'CANCELLED', reason };

            routeStateMachineServiceMock.cancelRoute.mockResolvedValue(result);

            const response = await RouteActions.cancelRoute(routeId, reason);

            expect(routeStateMachineServiceMock.cancelRoute).toHaveBeenCalledWith(routeId, reason);
            expect(response).toEqual(result);
        });

        it('should cancel route without reason', async () => {
            const routeId = '123';
            const result = { success: true, routeId, status: 'CANCELLED' };

            routeStateMachineServiceMock.cancelRoute.mockResolvedValue(result);

            const response = await RouteActions.cancelRoute(routeId);

            expect(routeStateMachineServiceMock.cancelRoute).toHaveBeenCalledWith(routeId, undefined);
            expect(response).toEqual(result);
        });

        it('should handle state machine errors during route cancellation', async () => {
            const routeId = '123';

            routeStateMachineServiceMock.cancelRoute.mockRejectedValue(
                new Error('Cannot cancel completed route')
            );

            await expect(RouteActions.cancelRoute(routeId))
                .rejects.toThrow('Cannot cancel completed route');
        });
    });

    describe('retryRoute', () => {
        it('should retry cancelled route using state machine', async () => {
            const routeId = '123';
            const result = { success: true, routeId, status: 'PENDING' };

            routeStateMachineServiceMock.retryRoute.mockResolvedValue(result);

            const response = await RouteActions.retryRoute(routeId);

            expect(routeStateMachineServiceMock.retryRoute).toHaveBeenCalledWith(routeId);
            expect(response).toEqual(result);
        });

        it('should handle state machine errors during route retry', async () => {
            const routeId = '123';

            routeStateMachineServiceMock.retryRoute.mockRejectedValue(
                new Error('Cannot retry route that is not cancelled')
            );

            await expect(RouteActions.retryRoute(routeId))
                .rejects.toThrow('Cannot retry route that is not cancelled');
        });
    });

    describe('getValidTransitions', () => {
        it('should get valid transitions for route using state machine', async () => {
            const routeId = '123';
            const validTransitions = ['ASSIGN_VEHICLE', 'CANCEL'];

            routeStateMachineServiceMock.getValidTransitions.mockResolvedValue(validTransitions);

            const response = await RouteActions.getValidTransitions(routeId);

            expect(routeStateMachineServiceMock.getValidTransitions).toHaveBeenCalledWith(routeId);
            expect(response).toEqual(validTransitions);
        });

        it('should handle errors when getting valid transitions', async () => {
            const routeId = '123';

            routeStateMachineServiceMock.getValidTransitions.mockRejectedValue(
                new Error('Route not found')
            );

            await expect(RouteActions.getValidTransitions(routeId))
                .rejects.toThrow('Route not found');
        });
    });

    describe('remove', () => {
        it('should call RouteRepository.remove with correct id', async () => {
            const routeId = '123';

            routeRepositoryMock.remove.mockResolvedValue(undefined);

            const result = await RouteActions.remove(routeId);

            expect(routeRepositoryMock.remove).toHaveBeenCalledWith(routeId);
            expect(result).toBeUndefined();
        });

        it('should handle repository removal errors', async () => {
            const routeId = '123';

            routeRepositoryMock.remove.mockRejectedValue(new Error('Route not found'));

            await expect(RouteActions.remove(routeId)).rejects.toThrow('Route not found');
            expect(routeRepositoryMock.remove).toHaveBeenCalledWith(routeId);
        });

        it('should handle constraint violation when removing route with dependencies', async () => {
            const routeId = '123';

            routeRepositoryMock.remove.mockRejectedValue(
                new Error('Cannot delete route with active vehicle assignment')
            );

            await expect(RouteActions.remove(routeId))
                .rejects.toThrow('Cannot delete route with active vehicle assignment');
        });
    });
});