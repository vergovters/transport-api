import { Request, Response } from "express";
import { VehicleActions } from "../../app/vehicles/actions/vehicles.actions";
import { asyncWrapper } from "../../lib/errorWrapper";

export const VehicleHandler = {
    list: asyncWrapper(async (_req: Request, res: Response) => {
        const data = await VehicleActions.list();
        res.json(data);
    }, "Vehicle list"),

    create: asyncWrapper(async (req: Request, res: Response) => {
        const vehicle = await VehicleActions.create(req.body);
        res.status(201).json(vehicle);
    }, "Vehicle create"),

    update: asyncWrapper(async (req: Request, res: Response) => {
        const id = req.params.id;
        const vehicle = await VehicleActions.update(id, req.body);
        res.json(vehicle);
    }, "Vehicle update"),

    remove: asyncWrapper(async (req: Request, res: Response) => {
        const id = req.params.id;
        await VehicleActions.remove(id);
        res.status(204).send();
    }, "Vehicle remove"),
};
