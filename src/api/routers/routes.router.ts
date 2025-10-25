import { Router } from "express";
import { RouteHandler } from "../handlers/routes.handler";

export const routeRouter = Router();

routeRouter.get("/", RouteHandler.list);
routeRouter.post("/", RouteHandler.create);
routeRouter.put("/:id", RouteHandler.update);
routeRouter.delete("/:id", RouteHandler.remove);

routeRouter.post("/:id/assign-vehicle", RouteHandler.assignVehicle);
routeRouter.post("/:id/start", RouteHandler.startRoute);
routeRouter.post("/:id/complete", RouteHandler.completeRoute);
routeRouter.post("/:id/cancel", RouteHandler.cancelRoute);
routeRouter.post("/:id/retry", RouteHandler.retryRoute);
routeRouter.get("/:id/transitions", RouteHandler.getValidTransitions);