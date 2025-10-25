import { VehicleRepository } from "../persistence/vehicles.persistence";
import { CreateVehicleSchema, UpdateVehicleSchema } from "../../../models/vehicle.model";

export const VehicleActions = {
    async list() {
        return VehicleRepository.getAll();
    },

    async create(data: unknown) {
        const parsed = CreateVehicleSchema.parse(data);
        return VehicleRepository.create(parsed);
    },

    async update(id: string, data: unknown) {
        const parsed = UpdateVehicleSchema.parse(data);
        return VehicleRepository.update(id, parsed);
    },

    async remove(id: string) {
        return VehicleRepository.remove(id);
    },
};
