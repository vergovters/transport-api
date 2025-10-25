import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { mock } from 'jest-mock-extended';

const mockRouteRepository = mock<any>();
const mockVehicleRepository = mock<any>();
const mockCurrencyService = mock<any>();
const mockCreateActor = jest.fn();
const mockRouteMachine = {};
const mockMapStateToRouteStatus = jest.fn();
const mockMapRouteStatusToState = jest.fn();

jest.mock('xstate', () => ({
    createActor: mockCreateActor
}));

jest.mock('../../../../src/lib/routeStateMachine', () => ({
    routeMachine: mockRouteMachine,
    mapStateToRouteStatus: mockMapStateToRouteStatus,
    mapRouteStatusToState: mockMapRouteStatusToState
}));

jest.mock('../../../../src/app/routes/persistence/routes.persistence', () => ({
    RouteRepository: mockRouteRepository
}));

jest.mock('../../../../src/app/vehicles/persistence/vehicles.persistence', () => ({
    VehicleRepository: mockVehicleRepository
}));

jest.mock('../../../../src/lib/currency', () => ({
    CurrencyService: mockCurrencyService
}));

import { RouteStateMachineService } from '../../../../src/app/routes/services/routeStateMachine.service';

describe('RouteStateMachineService', () => {
    let mockActor: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockActor = {
            start: jest.fn(),
            stop: jest.fn(),
            send: jest.fn(),
            getSnapshot: jest.fn()
        };

        mockCreateActor.mockReturnValue(mockActor);
    });

    describe('initializeRouteMachine', () => {
        it('should initialize state machine with route data', async () => {
            const mockRoute = {
                id: 'route-1',
                status: 'PENDING',
                vehicleId: null,
                departureDate: null,
                completionDate: null
            };

            mockRouteRepository.getById.mockResolvedValue(mockRoute);

            const result = await RouteStateMachineService.initializeRouteMachine('route-1');

            expect(mockRouteRepository.getById).toHaveBeenCalledWith('route-1');
            expect(mockCreateActor).toHaveBeenCalledWith(mockRouteMachine, {
                input: {
                    routeId: 'route-1',
                    vehicleId: undefined,
                    departureDate: undefined,
                    completionDate: undefined
                }
            });
            expect(mockActor.start).toHaveBeenCalled();
            expect(result).toEqual({ actor: mockActor, route: mockRoute });
        });

        it('should throw error if route not found', async () => {
            mockRouteRepository.getById.mockResolvedValue(null);

            await expect(RouteStateMachineService.initializeRouteMachine('nonexistent'))
                .rejects.toThrow('Route with id nonexistent not found');
        });

        it('should sync machine state with database status for assigned route', async () => {
            const mockRoute = {
                id: 'route-1',
                status: 'PENDING',
                vehicleId: 'vehicle-1',
                departureDate: null,
                completionDate: null
            };

            mockRouteRepository.getById.mockResolvedValue(mockRoute);

            await RouteStateMachineService.initializeRouteMachine('route-1');

            expect(mockActor.send).toHaveBeenCalledWith({
                type: 'ASSIGN_VEHICLE',
                vehicleId: 'vehicle-1'
            });
        });

        it('should sync machine state for IN_PROGRESS route', async () => {
            const mockRoute = {
                id: 'route-1',
                status: 'IN_PROGRESS',
                vehicleId: 'vehicle-1',
                departureDate: new Date(),
                completionDate: null
            };

            mockRouteRepository.getById.mockResolvedValue(mockRoute);

            await RouteStateMachineService.initializeRouteMachine('route-1');

            expect(mockActor.send).toHaveBeenCalledWith({
                type: 'ASSIGN_VEHICLE',
                vehicleId: 'vehicle-1'
            });
            expect(mockActor.send).toHaveBeenCalledWith({
                type: 'START_ROUTE',
                departureDate: mockRoute.departureDate
            });
        });
    });

    describe('assignVehicle', () => {
        it('should assign vehicle to route in PENDING status', async () => {
            const mockRoute = {
                id: 'route-1',
                status: 'PENDING',
                vehicleId: null,
                distanceKm: 100
            };

            const mockVehicle = {
                id: 'vehicle-1',
                plateNumber: 'ABC123',
                status: 'FREE',
                pricePerKmEur: 1.5
            };

            const mockCosts = {
                eur: 150,
                usd: 162,
                uah: 6150
            };

            const mockSnapshot = {
                can: jest.fn().mockReturnValue(true),
                value: 'assigned'
            };

            mockRouteRepository.getById.mockResolvedValue(mockRoute);
            mockVehicleRepository.getById.mockResolvedValue(mockVehicle);
            mockCurrencyService.calculateRouteCost.mockResolvedValue(mockCosts);
            mockActor.getSnapshot.mockReturnValue(mockSnapshot);
            mockMapStateToRouteStatus.mockReturnValue('ASSIGNED');

            const updatedRoute = { ...mockRoute, vehicleId: 'vehicle-1', status: 'ASSIGNED' };
            mockRouteRepository.update.mockResolvedValue(updatedRoute);

            const result = await RouteStateMachineService.assignVehicle('route-1', 'vehicle-1');

            expect(mockVehicleRepository.getById).toHaveBeenCalledWith('vehicle-1');
            expect(mockCurrencyService.calculateRouteCost).toHaveBeenCalledWith(100, 1.5);
            expect(mockActor.send).toHaveBeenCalledWith({
                type: 'ASSIGN_VEHICLE',
                vehicleId: 'vehicle-1'
            });
            expect(mockRouteRepository.update).toHaveBeenCalledWith('route-1', {
                vehicleId: 'vehicle-1',
                status: 'ASSIGNED',
                costEur: 150,
                costUsd: 162,
                costUah: 6150
            });
            expect(mockVehicleRepository.update).toHaveBeenCalledWith('vehicle-1', {
                status: 'BUSY',
                currentRouteId: 'route-1'
            });
            expect(result).toEqual(updatedRoute);
        });

        it('should calculate costs in EUR, USD, UAH', async () => {
            const mockRoute = { id: 'route-1', status: 'PENDING', distanceKm: 50 };
            const mockVehicle = { id: 'vehicle-1', status: 'FREE', pricePerKmEur: 2.0 };
            const mockCosts = { eur: 100, usd: 108, uah: 4100 };

            mockRouteRepository.getById.mockResolvedValue(mockRoute);
            mockVehicleRepository.getById.mockResolvedValue(mockVehicle);
            mockCurrencyService.calculateRouteCost.mockResolvedValue(mockCosts);
            mockActor.getSnapshot.mockReturnValue({ can: jest.fn().mockReturnValue(true), value: 'assigned' });
            mockMapStateToRouteStatus.mockReturnValue('ASSIGNED');
            mockRouteRepository.update.mockResolvedValue({});

            await RouteStateMachineService.assignVehicle('route-1', 'vehicle-1');

            expect(mockCurrencyService.calculateRouteCost).toHaveBeenCalledWith(50, 2.0);
            expect(mockRouteRepository.update).toHaveBeenCalledWith('route-1',
                expect.objectContaining({
                    costEur: 100,
                    costUsd: 108,
                    costUah: 4100
                })
            );
        });

        it('should update vehicle status to BUSY', async () => {
            const mockRoute = { id: 'route-1', status: 'PENDING', distanceKm: 100 };
            const mockVehicle = { id: 'vehicle-1', status: 'FREE', pricePerKmEur: 1.5 };

            mockRouteRepository.getById.mockResolvedValue(mockRoute);
            mockVehicleRepository.getById.mockResolvedValue(mockVehicle);
            mockCurrencyService.calculateRouteCost.mockResolvedValue({ eur: 150, usd: 162, uah: 6150 });
            mockActor.getSnapshot.mockReturnValue({ can: jest.fn().mockReturnValue(true), value: 'assigned' });
            mockMapStateToRouteStatus.mockReturnValue('ASSIGNED');
            mockRouteRepository.update.mockResolvedValue({});

            await RouteStateMachineService.assignVehicle('route-1', 'vehicle-1');

            expect(mockVehicleRepository.update).toHaveBeenCalledWith('vehicle-1', {
                status: 'BUSY',
                currentRouteId: 'route-1'
            });
        });

        it('should throw error if vehicle not found', async () => {
            const mockRoute = { id: 'route-1', status: 'PENDING' };

            mockRouteRepository.getById.mockResolvedValue(mockRoute);
            mockVehicleRepository.getById.mockResolvedValue(null);
            mockActor.getSnapshot.mockReturnValue({ can: jest.fn().mockReturnValue(true) });

            await expect(RouteStateMachineService.assignVehicle('route-1', 'vehicle-1'))
                .rejects.toThrow('Vehicle with id vehicle-1 not found');
        });

        it('should throw error if vehicle already busy', async () => {
            const mockRoute = { id: 'route-1', status: 'PENDING' };
            const mockVehicle = { id: 'vehicle-1', plateNumber: 'ABC123', status: 'BUSY' };

            mockRouteRepository.getById.mockResolvedValue(mockRoute);
            mockVehicleRepository.getById.mockResolvedValue(mockVehicle);
            mockActor.getSnapshot.mockReturnValue({ can: jest.fn().mockReturnValue(true) });

            await expect(RouteStateMachineService.assignVehicle('route-1', 'vehicle-1'))
                .rejects.toThrow('Vehicle ABC123 is not available (status: BUSY)');
        });

        it('should throw error if cannot assign vehicle in current state', async () => {
            const mockRoute = { id: 'route-1', status: 'COMPLETED' };

            mockRouteRepository.getById.mockResolvedValue(mockRoute);
            mockActor.getSnapshot.mockReturnValue({ can: jest.fn().mockReturnValue(false) });

            await expect(RouteStateMachineService.assignVehicle('route-1', 'vehicle-1'))
                .rejects.toThrow('Cannot assign vehicle to route in COMPLETED status');
        });
    });

    describe('startRoute', () => {
        it('should start route from assigned state', async () => {
            const mockRoute = { id: 'route-1', status: 'ASSIGNED' };
            const departureDate = new Date();

            mockRouteRepository.getById.mockResolvedValue(mockRoute);
            mockActor.getSnapshot.mockReturnValue({
                can: jest.fn().mockReturnValue(true),
                value: 'inProgress'
            });
            mockMapStateToRouteStatus.mockReturnValue('IN_PROGRESS');

            const updatedRoute = { ...mockRoute, status: 'IN_PROGRESS', departureDate };
            mockRouteRepository.update.mockResolvedValue(updatedRoute);

            const result = await RouteStateMachineService.startRoute('route-1', departureDate);

            expect(mockActor.send).toHaveBeenCalledWith({
                type: 'START_ROUTE',
                departureDate
            });
            expect(mockRouteRepository.update).toHaveBeenCalledWith('route-1', {
                status: 'IN_PROGRESS',
                departureDate
            });
            expect(result).toEqual(updatedRoute);
        });

        it('should set departure date to current date if not provided', async () => {
            const mockRoute = { id: 'route-1', status: 'ASSIGNED' };

            mockRouteRepository.getById.mockResolvedValue(mockRoute);
            mockActor.getSnapshot.mockReturnValue({
                can: jest.fn().mockReturnValue(true),
                value: 'inProgress'
            });
            mockMapStateToRouteStatus.mockReturnValue('IN_PROGRESS');
            mockRouteRepository.update.mockResolvedValue({});

            await RouteStateMachineService.startRoute('route-1');

            expect(mockRouteRepository.update).toHaveBeenCalledWith('route-1',
                expect.objectContaining({
                    status: 'IN_PROGRESS',
                    departureDate: expect.any(Date)
                })
            );
        });

        it('should throw error if not in valid state', async () => {
            const mockRoute = { id: 'route-1', status: 'PENDING' };

            mockRouteRepository.getById.mockResolvedValue(mockRoute);
            mockActor.getSnapshot.mockReturnValue({ can: jest.fn().mockReturnValue(false) });

            await expect(RouteStateMachineService.startRoute('route-1'))
                .rejects.toThrow('Cannot start route in PENDING status');
        });
    });

    describe('completeRoute', () => {
        it('should complete route from IN_PROGRESS state', async () => {
            const mockRoute = {
                id: 'route-1',
                status: 'IN_PROGRESS',
                vehicleId: 'vehicle-1'
            };
            const completionDate = new Date();

            mockRouteRepository.getById.mockResolvedValue(mockRoute);
            mockActor.getSnapshot.mockReturnValue({
                can: jest.fn().mockReturnValue(true),
                value: 'completed'
            });
            mockMapStateToRouteStatus.mockReturnValue('COMPLETED');

            const updatedRoute = { ...mockRoute, status: 'COMPLETED', completionDate };
            mockRouteRepository.update.mockResolvedValue(updatedRoute);



            const result = await RouteStateMachineService.completeRoute('route-1', completionDate);

            expect(mockActor.send).toHaveBeenCalledWith({
                type: 'COMPLETE_ROUTE',
                completionDate
            });
            expect(mockRouteRepository.update).toHaveBeenCalledWith('route-1', {
                status: 'COMPLETED',
                completionDate
            });
            expect(mockVehicleRepository.update).toHaveBeenCalledWith('vehicle-1', {
                status: 'FREE',
                currentRouteId: null
            });
            expect(result).toEqual(updatedRoute);

        });

        it('should set completion date to current date if not provided', async () => {
            const mockRoute = {
                id: 'route-1',
                status: 'IN_PROGRESS',
                vehicleId: 'vehicle-1'
            };

            mockRouteRepository.getById.mockResolvedValue(mockRoute);
            mockActor.getSnapshot.mockReturnValue({
                can: jest.fn().mockReturnValue(true),
                value: 'completed'
            });
            mockMapStateToRouteStatus.mockReturnValue('COMPLETED');
            mockRouteRepository.update.mockResolvedValue({});


            await RouteStateMachineService.completeRoute('route-1');

            expect(mockRouteRepository.update).toHaveBeenCalledWith('route-1',
                expect.objectContaining({
                    status: 'COMPLETED',
                    completionDate: expect.any(Date)
                })
            );
        });

        it('should free vehicle status', async () => {
            const mockRoute = {
                id: 'route-1',
                status: 'IN_PROGRESS',
                vehicleId: 'vehicle-1'
            };

            mockRouteRepository.getById.mockResolvedValue(mockRoute);
            mockActor.getSnapshot.mockReturnValue({
                can: jest.fn().mockReturnValue(true),
                value: 'completed'
            });
            mockMapStateToRouteStatus.mockReturnValue('COMPLETED');
            mockRouteRepository.update.mockResolvedValue({});

            await RouteStateMachineService.completeRoute('route-1');

            expect(mockVehicleRepository.update).toHaveBeenCalledWith('vehicle-1', {
                status: 'FREE',
                currentRouteId: null
            });
        });

        it('should not update vehicle if no vehicle assigned', async () => {
            const mockRoute = {
                id: 'route-1',
                status: 'IN_PROGRESS',
                vehicleId: null
            };

            mockRouteRepository.getById.mockResolvedValue(mockRoute);
            mockActor.getSnapshot.mockReturnValue({
                can: jest.fn().mockReturnValue(true),
                value: 'completed'
            });
            mockMapStateToRouteStatus.mockReturnValue('COMPLETED');
            mockRouteRepository.update.mockResolvedValue({});

            await RouteStateMachineService.completeRoute('route-1');

            expect(mockVehicleRepository.update).not.toHaveBeenCalled();
        });

        it('should throw error if not in IN_PROGRESS state', async () => {
            const mockRoute = { id: 'route-1', status: 'PENDING' };

            mockRouteRepository.getById.mockResolvedValue(mockRoute);
            mockActor.getSnapshot.mockReturnValue({
                can: jest.fn().mockReturnValue(false),
                value: 'pending'
            });

            await expect(RouteStateMachineService.completeRoute('route-1'))
                .rejects.toThrow('Cannot complete route: current status in DB is "PENDING", machine state is "pending". Route must be in IN_PROGRESS status to be completed.');
        });
    });

    describe('cancelRoute', () => {
        it('should cancel route from any state', async () => {
            const mockRoute = {
                id: 'route-1',
                status: 'IN_PROGRESS',
                vehicleId: 'vehicle-1'
            };

            mockRouteRepository.getById.mockResolvedValue(mockRoute);
            mockActor.getSnapshot.mockReturnValue({
                can: jest.fn().mockReturnValue(true),
                value: 'cancelled'
            });
            mockMapStateToRouteStatus.mockReturnValue('CANCELLED');

            const updatedRoute = { ...mockRoute, status: 'CANCELLED' };
            mockRouteRepository.update.mockResolvedValue(updatedRoute);

            const result = await RouteStateMachineService.cancelRoute('route-1', 'Test cancellation');

            expect(mockActor.send).toHaveBeenCalledWith({
                type: 'CANCEL_ROUTE',
                reason: 'Test cancellation'
            });
            expect(mockRouteRepository.update).toHaveBeenCalledWith('route-1', {
                status: 'CANCELLED'
            });
            expect(mockVehicleRepository.update).toHaveBeenCalledWith('vehicle-1', {
                status: 'FREE',
                currentRouteId: null
            });
            expect(result).toEqual(updatedRoute);
        });

        it('should store cancellation reason', async () => {
            const mockRoute = { id: 'route-1', status: 'ASSIGNED' };

            mockRouteRepository.getById.mockResolvedValue(mockRoute);
            mockActor.getSnapshot.mockReturnValue({ can: jest.fn().mockReturnValue(true) });
            mockRouteRepository.update.mockResolvedValue({});

            await RouteStateMachineService.cancelRoute('route-1', 'Custom reason');

            expect(mockActor.send).toHaveBeenCalledWith({
                type: 'CANCEL_ROUTE',
                reason: 'Custom reason'
            });
        });

        it('should free vehicle if assigned', async () => {
            const mockRoute = {
                id: 'route-1',
                status: 'ASSIGNED',
                vehicleId: 'vehicle-1'
            };

            mockRouteRepository.getById.mockResolvedValue(mockRoute);
            mockActor.getSnapshot.mockReturnValue({ can: jest.fn().mockReturnValue(true) });
            mockRouteRepository.update.mockResolvedValue({});

            await RouteStateMachineService.cancelRoute('route-1');

            expect(mockVehicleRepository.update).toHaveBeenCalledWith('vehicle-1', {
                status: 'FREE',
                currentRouteId: null
            });
        });

        it('should not update vehicle if no vehicle assigned', async () => {
            const mockRoute = {
                id: 'route-1',
                status: 'PENDING',
                vehicleId: null
            };

            mockRouteRepository.getById.mockResolvedValue(mockRoute);
            mockActor.getSnapshot.mockReturnValue({ can: jest.fn().mockReturnValue(true) });
            mockRouteRepository.update.mockResolvedValue({});

            await RouteStateMachineService.cancelRoute('route-1');

            expect(mockVehicleRepository.update).not.toHaveBeenCalled();
        });

        it('should throw error if cannot cancel in current state', async () => {
            const mockRoute = { id: 'route-1', status: 'COMPLETED' };

            mockRouteRepository.getById.mockResolvedValue(mockRoute);
            mockActor.getSnapshot.mockReturnValue({ can: jest.fn().mockReturnValue(false) });

            await expect(RouteStateMachineService.cancelRoute('route-1'))
                .rejects.toThrow('Cannot cancel route in COMPLETED status');
        });
    });

    describe('retryRoute', () => {
        it('should retry cancelled route', async () => {
            const mockRoute = {
                id: 'route-1',
                status: 'CANCELLED',
                vehicleId: 'vehicle-1',
                completionDate: new Date(),
                costEur: 150,
                costUsd: 162,
                costUah: 6150
            };

            mockRouteRepository.getById.mockResolvedValue(mockRoute);
            mockActor.getSnapshot.mockReturnValue({
                can: jest.fn().mockReturnValue(true),
                value: 'pending'
            });
            mockMapStateToRouteStatus.mockReturnValue('PENDING');

            const updatedRoute = {
                ...mockRoute,
                status: 'PENDING',
                vehicleId: null,
                completionDate: null,
                costEur: undefined,
                costUsd: undefined,
                costUah: undefined
            };
            mockRouteRepository.update.mockResolvedValue(updatedRoute);

            const result = await RouteStateMachineService.retryRoute('route-1');

            expect(mockActor.send).toHaveBeenCalledWith({ type: 'RETRY' });
            expect(mockRouteRepository.update).toHaveBeenCalledWith('route-1', {
                status: 'PENDING',
                vehicleId: null,
                completionDate: null,
                costEur: undefined,
                costUsd: undefined,
                costUah: undefined
            });
            expect(result).toEqual(updatedRoute);
        });

        it('should clear error state', async () => {
            const mockRoute = {
                id: 'route-1',
                status: 'CANCELLED',
                costEur: 100,
                costUsd: 108,
                costUah: 4100
            };

            mockRouteRepository.getById.mockResolvedValue(mockRoute);
            mockActor.getSnapshot.mockReturnValue({ can: jest.fn().mockReturnValue(true) });
            mockMapStateToRouteStatus.mockReturnValue('PENDING');
            mockRouteRepository.update.mockResolvedValue({});

            await RouteStateMachineService.retryRoute('route-1');

            expect(mockRouteRepository.update).toHaveBeenCalledWith('route-1',
                expect.objectContaining({
                    status: 'PENDING',
                    vehicleId: null,
                    completionDate: null,
                    costEur: undefined,
                    costUsd: undefined,
                    costUah: undefined
                })
            );
        });

        it('should throw error if cannot retry in current state', async () => {
            const mockRoute = { id: 'route-1', status: 'COMPLETED' };

            mockRouteRepository.getById.mockResolvedValue(mockRoute);
            mockActor.getSnapshot.mockReturnValue({ can: jest.fn().mockReturnValue(false) });

            await expect(RouteStateMachineService.retryRoute('route-1'))
                .rejects.toThrow('Cannot retry route in COMPLETED status');
        });
    });

    describe('getValidTransitions', () => {
        it('should return all valid transitions for current state', async () => {
            const mockRoute = { id: 'route-1', status: 'ASSIGNED' };

            mockRouteRepository.getById.mockResolvedValue(mockRoute);

            const mockSnapshot = {
                can: jest.fn()
                    .mockReturnValueOnce(false)
                    .mockReturnValueOnce(true)
                    .mockReturnValueOnce(false)
                    .mockReturnValueOnce(true)
                    .mockReturnValueOnce(false)
            };

            mockActor.getSnapshot.mockReturnValue(mockSnapshot);

            const result = await RouteStateMachineService.getValidTransitions('route-1');

            expect(result).toEqual(['START_ROUTE', 'CANCEL_ROUTE']);
            expect(mockSnapshot.can).toHaveBeenCalledWith({ type: 'ASSIGN_VEHICLE', vehicleId: 'test' });
            expect(mockSnapshot.can).toHaveBeenCalledWith({ type: 'START_ROUTE' });
            expect(mockSnapshot.can).toHaveBeenCalledWith({ type: 'COMPLETE_ROUTE' });
            expect(mockSnapshot.can).toHaveBeenCalledWith({ type: 'CANCEL_ROUTE' });
            expect(mockSnapshot.can).toHaveBeenCalledWith({ type: 'RETRY' });
        });

        it('should return empty array if no transitions available', async () => {
            const mockRoute = { id: 'route-1', status: 'COMPLETED' };

            mockRouteRepository.getById.mockResolvedValue(mockRoute);
            mockActor.getSnapshot.mockReturnValue({
                can: jest.fn().mockReturnValue(false)
            });

            const result = await RouteStateMachineService.getValidTransitions('route-1');

            expect(result).toEqual([]);
        });
    });
});