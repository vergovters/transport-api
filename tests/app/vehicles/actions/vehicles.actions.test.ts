import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Vehicle } from '@prisma/client';
import { mock } from 'jest-mock-extended';

const vehicleRepositoryMock = mock<any>();
const createVehicleSchemaMock = mock<any>();
const updateVehicleSchemaMock = mock<any>();

jest.mock('../../../../src/app/vehicles/persistence/vehicles.persistence', () => ({
    VehicleRepository: vehicleRepositoryMock
}));

jest.mock('../../../../src/models/vehicle.model', () => ({
    CreateVehicleSchema: createVehicleSchemaMock,
    UpdateVehicleSchema: updateVehicleSchemaMock,
}));

import { VehicleActions } from '../../../../src/app/vehicles/actions/vehicles.actions';

describe('VehicleActions', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('list', () => {
        it('should call VehicleRepository.getAll', async () => {
            const mockVehicles = [
                { id: '1', type: 'TRUCK', licensePlate: 'ABC123' } as Partial<Vehicle>,
                { id: '2', type: 'VAN', licensePlate: 'DEF456' } as Partial<Vehicle>
            ] as Vehicle[];

            vehicleRepositoryMock.getAll.mockResolvedValue(mockVehicles);

            const result = await VehicleActions.list();

            expect(vehicleRepositoryMock.getAll).toHaveBeenCalled();
            expect(result).toEqual(mockVehicles);
        });

        it('should handle repository errors', async () => {
            vehicleRepositoryMock.getAll.mockRejectedValue(new Error('Database error'));

            await expect(VehicleActions.list()).rejects.toThrow('Database error');
            expect(vehicleRepositoryMock.getAll).toHaveBeenCalled();
        });
    });

    describe('create', () => {
        it('should validate data and create vehicle', async () => {
            const inputData = { type: 'TRUCK', licensePlate: 'ABC123', costPerKm: 1.5 };
            const parsedData = { type: 'TRUCK', licensePlate: 'ABC123', costPerKm: 1.5 } as Partial<Vehicle>;
            const createdVehicle = { id: '1', ...parsedData } as Vehicle;

            createVehicleSchemaMock.parse.mockReturnValue(parsedData);
            vehicleRepositoryMock.create.mockResolvedValue(createdVehicle);

            const result = await VehicleActions.create(inputData);

            expect(createVehicleSchemaMock.parse).toHaveBeenCalledWith(inputData);
            expect(vehicleRepositoryMock.create).toHaveBeenCalledWith(expect.objectContaining({
                type: 'TRUCK',
                licensePlate: 'ABC123',
                costPerKm: 1.5
            }));
            expect(result).toEqual(createdVehicle);
        });

        it('should throw validation error for invalid data', async () => {
            const invalidData = { type: 'INVALID_TYPE' };

            createVehicleSchemaMock.parse.mockImplementation(() => {
                throw new Error('Validation error');
            });

            await expect(VehicleActions.create(invalidData)).rejects.toThrow('Validation error');
            expect(createVehicleSchemaMock.parse).toHaveBeenCalledWith(invalidData);
            expect(vehicleRepositoryMock.create).not.toHaveBeenCalled();
        });

        it('should handle repository creation errors', async () => {
            const validData = { type: 'TRUCK', licensePlate: 'ABC123' };

            createVehicleSchemaMock.parse.mockReturnValue(validData);
            vehicleRepositoryMock.create.mockRejectedValue(new Error('Creation failed'));

            await expect(VehicleActions.create(validData)).rejects.toThrow('Creation failed');
            expect(vehicleRepositoryMock.create).toHaveBeenCalled();
        });
    });

    describe('update', () => {
        it('should validate data and update vehicle', async () => {
            const vehicleId = '123';
            const inputData = { licensePlate: 'XYZ789', costPerKm: 2.0 };
            const parsedData = { licensePlate: 'XYZ789', costPerKm: 2.0 } as Partial<Vehicle>;
            const updatedVehicle = { id: vehicleId, ...parsedData } as Vehicle;

            updateVehicleSchemaMock.parse.mockReturnValue(parsedData);
            vehicleRepositoryMock.update.mockResolvedValue(updatedVehicle);

            const result = await VehicleActions.update(vehicleId, inputData);

            expect(updateVehicleSchemaMock.parse).toHaveBeenCalledWith(inputData);
            expect(vehicleRepositoryMock.update).toHaveBeenCalledWith(vehicleId, expect.objectContaining({
                licensePlate: 'XYZ789',
                costPerKm: 2.0
            }));
            expect(result).toEqual(updatedVehicle);
        });

        it('should throw validation error for invalid update data', async () => {
            const vehicleId = '123';
            const invalidData = { costPerKm: -1 };

            updateVehicleSchemaMock.parse.mockImplementation(() => {
                throw new Error('Invalid cost per km');
            });

            await expect(VehicleActions.update(vehicleId, invalidData)).rejects.toThrow('Invalid cost per km');
            expect(updateVehicleSchemaMock.parse).toHaveBeenCalledWith(invalidData);
            expect(vehicleRepositoryMock.update).not.toHaveBeenCalled();
        });

        it('should handle repository update errors', async () => {
            const vehicleId = '123';
            const validData = { licensePlate: 'XYZ789' };

            updateVehicleSchemaMock.parse.mockReturnValue(validData);
            vehicleRepositoryMock.update.mockRejectedValue(new Error('Update failed'));

            await expect(VehicleActions.update(vehicleId, validData)).rejects.toThrow('Update failed');
            expect(vehicleRepositoryMock.update).toHaveBeenCalled();
        });
    });

    describe('remove', () => {
        it('should call VehicleRepository.remove with correct id', async () => {
            const vehicleId = '123';

            vehicleRepositoryMock.remove.mockResolvedValue(undefined);

            const result = await VehicleActions.remove(vehicleId);

            expect(vehicleRepositoryMock.remove).toHaveBeenCalledWith(vehicleId);
            expect(result).toBeUndefined();
        });

        it('should handle repository removal errors', async () => {
            const vehicleId = '123';

            vehicleRepositoryMock.remove.mockRejectedValue(new Error('Vehicle not found'));

            await expect(VehicleActions.remove(vehicleId)).rejects.toThrow('Vehicle not found');
            expect(vehicleRepositoryMock.remove).toHaveBeenCalledWith(vehicleId);
        });
    });
});
