import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Transport API',
            version: '1.0.0',
            description: 'A comprehensive transport management API with route planning, vehicle management, and XState workflow integration',
            contact: {
                name: 'Transport API Support',
                email: 'support@transport-api.com'
            }
        },
        servers: [
            {
                url: process.env.NODE_ENV === 'production' ? 'https://api.transport.com' : 'http://localhost:3000',
                description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                ApiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'x-api-key',
                    description: 'API key for authentication'
                }
            },
            schemas: {
                Vehicle: {
                    type: 'object',
                    required: ['type', 'licensePlate', 'costPerKm'],
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        type: { type: 'string', enum: ['TRUCK', 'CAR', 'VAN', 'BUS', 'MOTORCYCLE'] },
                        licensePlate: { type: 'string' },
                        costPerKm: { type: 'number', minimum: 0 },
                        status: { type: 'string', enum: ['FREE', 'BUSY', 'MAINTENANCE', 'OUT_OF_ORDER'], default: 'FREE' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                CreateVehicle: {
                    type: 'object',
                    required: ['type', 'licensePlate', 'costPerKm'],
                    properties: {
                        type: { type: 'string', enum: ['TRUCK', 'CAR', 'VAN', 'BUS', 'MOTORCYCLE'] },
                        licensePlate: { type: 'string' },
                        costPerKm: { type: 'number', minimum: 0 }
                    }
                },
                UpdateVehicle: {
                    type: 'object',
                    properties: {
                        type: { type: 'string', enum: ['TRUCK', 'CAR', 'VAN', 'BUS', 'MOTORCYCLE'] },
                        licensePlate: { type: 'string' },
                        costPerKm: { type: 'number', minimum: 0 },
                        status: { type: 'string', enum: ['FREE', 'BUSY', 'MAINTENANCE', 'OUT_OF_ORDER'] }
                    }
                },
                Route: {
                    type: 'object',
                    required: ['startLat', 'startLon', 'endLat', 'endLon', 'departureDate', 'requiredVehicleType'],
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        startLat: { type: 'number', minimum: -90, maximum: 90 },
                        startLon: { type: 'number', minimum: -180, maximum: 180 },
                        endLat: { type: 'number', minimum: -90, maximum: 90 },
                        endLon: { type: 'number', minimum: -180, maximum: 180 },
                        distanceKm: { type: 'number', minimum: 0 },
                        departureDate: { type: 'string', format: 'date-time' },
                        completionDate: { type: 'string', format: 'date-time', nullable: true },
                        requiredVehicleType: { type: 'string', enum: ['TRUCK', 'CAR', 'VAN', 'BUS', 'MOTORCYCLE'] },
                        expectedRevenueUsd: { type: 'number', minimum: 0 },
                        vehicleId: { type: 'string', format: 'uuid', nullable: true },
                        status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], default: 'PENDING' },
                        costEur: { type: 'number', minimum: 0 },
                        costUsd: { type: 'number', minimum: 0 },
                        costUah: { type: 'number', minimum: 0 },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                CreateRoute: {
                    type: 'object',
                    required: ['startLat', 'startLon', 'endLat', 'endLon', 'departureDate', 'requiredVehicleType'],
                    properties: {
                        startLat: { type: 'number', minimum: -90, maximum: 90 },
                        startLon: { type: 'number', minimum: -180, maximum: 180 },
                        endLat: { type: 'number', minimum: -90, maximum: 90 },
                        endLon: { type: 'number', minimum: -180, maximum: 180 },
                        departureDate: { type: 'string', format: 'date-time' },
                        requiredVehicleType: { type: 'string', enum: ['TRUCK', 'CAR', 'VAN', 'BUS', 'MOTORCYCLE'] },
                        expectedRevenueUsd: { type: 'number', minimum: 0 }
                    }
                },
                UpdateRoute: {
                    type: 'object',
                    properties: {
                        startLat: { type: 'number', minimum: -90, maximum: 90 },
                        startLon: { type: 'number', minimum: -180, maximum: 180 },
                        endLat: { type: 'number', minimum: -90, maximum: 90 },
                        endLon: { type: 'number', minimum: -180, maximum: 180 },
                        departureDate: { type: 'string', format: 'date-time' },
                        completionDate: { type: 'string', format: 'date-time', nullable: true },
                        requiredVehicleType: { type: 'string', enum: ['TRUCK', 'CAR', 'VAN', 'BUS', 'MOTORCYCLE'] },
                        expectedRevenueUsd: { type: 'number', minimum: 0 }
                    }
                },
                AssignVehicleRequest: {
                    type: 'object',
                    required: ['vehicleId'],
                    properties: {
                        vehicleId: { type: 'string', format: 'uuid' }
                    }
                },
                StartRouteRequest: {
                    type: 'object',
                    properties: {
                        departureDate: { type: 'string', format: 'date-time' }
                    }
                },
                CompleteRouteRequest: {
                    type: 'object',
                    properties: {
                        completionDate: { type: 'string', format: 'date-time' }
                    }
                },
                CancelRouteRequest: {
                    type: 'object',
                    properties: {
                        reason: { type: 'string' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                },
                ValidationError: {
                    type: 'object',
                    properties: {
                        error: { type: 'string', example: 'Validation error' },
                        message: { type: 'string' }
                    }
                }
            }
        },
        security: [
            {
                ApiKeyAuth: []
            }
        ]
    },
    apis: [
        './src/docs/*.ts'
    ]
};

export const swaggerSpec = swaggerJsdoc(options);