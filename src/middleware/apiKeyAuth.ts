import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

export default async function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
    const key = req.header('x-api-key');
    if (!key) return res.status(401).json({ error: 'Missing API key' });

    const apiKey = await prisma.apiKey.findUnique({ where: { key } });
    if (!apiKey || !apiKey.active) return res.status(403).json({ error: 'Invalid API key' });
    next();
}