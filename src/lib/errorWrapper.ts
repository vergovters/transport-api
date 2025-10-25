import { Request, Response } from "express";

export function handleError(res: Response, error: unknown, context: string = "Operation") {
    console.error(`${context} failed:`, error);

    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("not found") || message.includes("does not exist")) {
        return res.status(404).json({ error: "Resource not found", message });
    }

    if (message.includes("already exists") || message.includes("Unique constraint")) {
        return res.status(409).json({ error: "Resource already exists", message });
    }

    if (message.includes("validation") || message.includes("required") || message.includes("invalid")) {
        return res.status(400).json({ error: "Validation error", message });
    }

    res.status(500).json({ error: "Internal server error", message });
}

export function asyncWrapper(handler: (req: Request, res: Response) => Promise<void>, context: string) {
    return async (req: Request, res: Response) => {
        try {
            await handler(req, res);
        } catch (error) {
            handleError(res, error, context);
        }
    };
}