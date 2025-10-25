import { Router } from "express";
import { VehicleHandler } from "../handlers/vehicles.handler";

export const vehicleRouter = Router();

vehicleRouter.get("/", VehicleHandler.list);
vehicleRouter.post("/", VehicleHandler.create);
vehicleRouter.put("/:id", VehicleHandler.update);
vehicleRouter.delete("/:id", VehicleHandler.remove);