import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockPrisma = {
    apiKey: {
        findUnique: jest.fn(),
    },
};

jest.mock('../../src/lib/prisma', () => ({
    __esModule: true,
    default: mockPrisma,
}));

describe('API Key Auth Middleware', () => {
    let mockRequest: any;
    let mockResponse: any;
    let mockNext: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockRequest = {
            header: jest.fn(),
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        mockNext = jest.fn();
    });

    describe('authentication', () => {
        it('should allow requests with valid active API key', async () => {
            const validApiKey = {
                id: '1',
                key: 'valid-api-key',
                name: 'Test API Key',
                active: true,
                createdAt: new Date(),
            };

            mockRequest.header.mockReturnValue('valid-api-key');
            (mockPrisma.apiKey.findUnique as any).mockResolvedValue(validApiKey);

            const apiKeyAuth = (await import('../../src/middleware/apiKeyAuth')).default;

            await apiKeyAuth(mockRequest, mockResponse, mockNext);

            expect(mockPrisma.apiKey.findUnique).toHaveBeenCalledWith({
                where: { key: 'valid-api-key' }
            });
            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should reject requests without API key', async () => {
            mockRequest.header.mockReturnValue(undefined);

            const apiKeyAuth = (await import('../../src/middleware/apiKeyAuth')).default;
            await apiKeyAuth(mockRequest, mockResponse, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Missing API key'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should reject requests with invalid API key', async () => {
            mockRequest.header.mockReturnValue('invalid-key');
            (mockPrisma.apiKey.findUnique as any).mockResolvedValue(null);

            const apiKeyAuth = (await import('../../src/middleware/apiKeyAuth')).default;
            await apiKeyAuth(mockRequest, mockResponse, mockNext);

            expect(mockPrisma.apiKey.findUnique).toHaveBeenCalledWith({
                where: { key: 'invalid-key' }
            });
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Invalid API key'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should reject requests with inactive API key', async () => {
            const inactiveApiKey = {
                id: '2',
                key: 'inactive-key',
                name: 'Inactive API Key',
                active: false,
                createdAt: new Date(),
            };

            mockRequest.header.mockReturnValue('inactive-key');
            (mockPrisma.apiKey.findUnique as any).mockResolvedValue(inactiveApiKey);

            const apiKeyAuth = (await import('../../src/middleware/apiKeyAuth')).default;
            await apiKeyAuth(mockRequest, mockResponse, mockNext);

            expect(mockPrisma.apiKey.findUnique).toHaveBeenCalledWith({
                where: { key: 'inactive-key' }
            });
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Invalid API key'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('header processing', () => {
        it('should read API key from x-api-key header', async () => {
            mockRequest.header.mockReturnValue('test-key');
            (mockPrisma.apiKey.findUnique as any).mockResolvedValue(null);

            const apiKeyAuth = (await import('../../src/middleware/apiKeyAuth')).default;
            await apiKeyAuth(mockRequest, mockResponse, mockNext);

            expect(mockRequest.header).toHaveBeenCalledWith('x-api-key');
        });

        it('should handle empty string as missing key', async () => {
            mockRequest.header.mockReturnValue('');

            const apiKeyAuth = (await import('../../src/middleware/apiKeyAuth')).default;
            await apiKeyAuth(mockRequest, mockResponse, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Missing API key'
            });
        });
    });

    describe('database errors', () => {
        it('should handle database connection errors', async () => {
            mockRequest.header.mockReturnValue('test-key');
            (mockPrisma.apiKey.findUnique as any).mockRejectedValue(new Error('Database connection failed'));

            const apiKeyAuth = (await import('../../src/middleware/apiKeyAuth')).default;

            await expect(apiKeyAuth(mockRequest, mockResponse, mockNext))
                .rejects.toThrow('Database connection failed');
        });
    });

    describe('edge cases', () => {
        it('should handle null API key from database', async () => {
            mockRequest.header.mockReturnValue('some-key');
            (mockPrisma.apiKey.findUnique as any).mockResolvedValue(null);

            const apiKeyAuth = (await import('../../src/middleware/apiKeyAuth')).default;
            await apiKeyAuth(mockRequest, mockResponse, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Invalid API key'
            });
        });

        it('should handle undefined active field as inactive', async () => {
            const apiKeyWithoutActive = {
                id: '3',
                key: 'test-key',
                name: 'Test Key',
                createdAt: new Date(),
            };

            mockRequest.header.mockReturnValue('test-key');
            (mockPrisma.apiKey.findUnique as any).mockResolvedValue(apiKeyWithoutActive);

            const apiKeyAuth = (await import('../../src/middleware/apiKeyAuth')).default;
            await apiKeyAuth(mockRequest, mockResponse, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(403);
        });
    });
});