import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { vehicleRouter } from './api/routers/vehicles.router';
import { routeRouter } from './api/routers/routes.router';
import apiKeyAuth from './middleware/apiKeyAuth';
import { swaggerSpec } from './config/swagger';

export const app = express();

app.use(cors());
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

app.use('/api/vehicles', apiKeyAuth, vehicleRouter);
app.use('/api/routes', apiKeyAuth, routeRouter);


app.get('/health', (_, res) => {
    res.send('Transport API is running 🚚');
});