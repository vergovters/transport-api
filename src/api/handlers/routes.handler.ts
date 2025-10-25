import { Request, Response } from "express";
import { RouteActions } from "../../app/routes/actions/routes.actions";
import { asyncWrapper } from "../../lib/errorWrapper";

export const RouteHandler = {
    list: asyncWrapper(async (_req: Request, res: Response) => {
        const data = await RouteActions.list();
        res.json(data);
    }, "Route list"),

    create: asyncWrapper(async (req: Request, res: Response) => {
        const route = await RouteActions.create(req.body);
        res.status(201).json(route);
    }, "Route create"),

    update: asyncWrapper(async (req: Request, res: Response) => {
        const id = req.params.id;
        const route = await RouteActions.update(id, req.body);
        res.json(route);
    }, "Route update"),

    assignVehicle: asyncWrapper(async (req: Request, res: Response) => {
        const { id } = req.params;
        const { vehicleId } = req.body;

        if (!vehicleId) {
            res.status(400).json({ error: 'vehicleId is required' });
            return;
        }

        const route = await RouteActions.assignVehicle(id, vehicleId);
        res.json(route);
    }, "Route assign vehicle"),

    startRoute: asyncWrapper(async (req: Request, res: Response) => {
        const { id } = req.params;
        const { departureDate } = req.body;

        const route = await RouteActions.startRoute(id, departureDate ? new Date(departureDate) : undefined);
        res.json(route);
    }, "Route start"),

    completeRoute: asyncWrapper(async (req: Request, res: Response) => {
        const { id } = req.params;
        const { completionDate } = req.body;

        const route = await RouteActions.completeRoute(id, completionDate ? new Date(completionDate) : undefined);
        res.json(route);
    }, "Route complete"),

    cancelRoute: asyncWrapper(async (req: Request, res: Response) => {
        const { id } = req.params;
        const { reason } = req.body;

        const route = await RouteActions.cancelRoute(id, reason);
        res.json(route);
    }, "Route cancel"),

    retryRoute: asyncWrapper(async (req: Request, res: Response) => {
        const { id } = req.params;
        const route = await RouteActions.retryRoute(id);
        res.json(route);
    }, "Route retry"),

    async getValidTransitions(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const transitions = await RouteActions.getValidTransitions(id);
            res.json({ validTransitions: transitions });
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },

    async remove(req: Request, res: Response) {
        try {
            const id = req.params.id;
            await RouteActions.remove(id);
            res.status(204).send();
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },
};
